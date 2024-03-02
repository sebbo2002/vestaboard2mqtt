import mqtt from 'async-mqtt';
import Config from './config.js';
import Cache from './cache.js';
import { MqttClient } from 'mqtt';
import Message from './message.js';
import pages from './pages/index.js';
import Page from './page.js';
import { Vesta } from 'vestaboard-api';

export default class Vestaboard2MQTT {
    private readonly mqtt: MqttClient;
    private readonly board: Vesta;
    private readonly pageConfig = new Cache('page-config');
    private subscriptionIds?: string[];
    private currentMessage?: {page: Page<unknown>, payload: string};
    private currentTimer?: NodeJS.Timeout;

    public static async run(): Promise<Vestaboard2MQTT> {
        await Config.load();
        return new Vestaboard2MQTT();
    }

    constructor() {
        this.board = new Vesta({
            apiKey: Config.board.key,
            apiSecret: Config.board.secret
        });

        this.mqtt = mqtt.connect(Config.mqtt.url, {
            will: {
                topic: Config.mqtt.prefix + '/status',
                payload: 'offline',
                qos: 0,
                retain: true
            }
        });
        this.mqtt.on('connect', () => {
            this.mqtt.publish(Config.mqtt.prefix + '/status', 'online', {
                retain: true
            });

            this.setupBrokerSubscriptions().catch(error => {
                console.error(new Error(`Unable to setup mqtt subscriptions: ${error.stack}`));
                process.exit(1);
            });
        });
        this.mqtt.on('message', (topic, message) => {
            this.handleMessage(topic, message.toString()).catch(error => {
                this.debug(`Unable to handle message: ${error.stack}`);
            });
        });
    }

    private async setupBrokerSubscriptions() {
        if(!this.mqtt) {
            throw new Error('Unable to setup subscriptions: client not set.');
        }

        await this.mqtt.subscribe(Config.mqtt.prefix + '/#');
    }

    private debug(message: Error | string) {
        const msg = String(message);
        this.mqtt.publish(Config.mqtt.prefix + '/debug', msg);
        console.log(msg);
    }

    private async handleMessage(topic: string, payload: string): Promise<void> {
        if([Config.mqtt.prefix + '/debug', Config.mqtt.prefix + '/status'].includes(topic)) {
            // just ignore my own events
        }
        else if(topic === Config.mqtt.prefix + '/disabled') {
            const value = ['1', 'true', 'TRUE'].includes(payload);
            await Config.updateDisabled(value);
            if(!value) {
                this.debug('Board not disabled anymore, update with latest message');
                await this.updateCurrentMessage();
            }
        }
        else if(Object.keys(pages).map(id => Config.mqtt.prefix + '/' + id).includes(topic)) {
            const page = pages[ topic.substr(Config.mqtt.prefix.length + 1) ];
            await this.renderMessage(page, payload);
        }
        else {
            const page = Object.entries(pages)
                .find(([id]) => topic.startsWith(Config.mqtt.prefix + '/' + id + '/'));

            if(!page) {
                this.debug(`Unknown topic ${topic}, I'm sorry`);
                return;
            }

            const key = topic.substr((Config.mqtt.prefix + '/' + page[0] + '/').length);
            const cache = await this.pageConfig.get<Partial<unknown>>(page[0]);

            const config = page[1].parseConfig(key, payload, cache || {});
            const newConfig = Object.assign(cache || {}, config);
            await this.pageConfig.set(page[0], newConfig);
            await this.updateCurrentMessage();
            this.debug(`Update config for page module ${page[0]}: ${JSON.stringify(newConfig, null, '    ')}`);
        }
    }

    private async updateCurrentMessage() {
        if(this.currentMessage) {
            await this.renderMessage(
                this.currentMessage.page,
                this.currentMessage.payload
            );
        }
    }

    private async renderMessage(page: Page<unknown>, payload: string) {
        this.currentMessage = {
            page,
            payload
        };

        const pageEntry = Object.entries(pages).find(([,pageInstance]) => pageInstance === page);
        if(Config.board.disabled || !pageEntry) {
            return;
        }

        const parsePayload = await page.parsePayload(payload);
        const config = await this.pageConfig.get<Partial<unknown>>(pageEntry[0]);

        const response = await page.render(parsePayload, config || {});
        if (response.message) {
            await this.sendMessage(response.message);
        }

        if(this.currentTimer) {
            clearTimeout(this.currentTimer);
            delete this.currentTimer;
        }
        if(response.validTill) {
            this.debug(`Set timer for ${response.validTill.toString()} to update message`);
            this.currentTimer = setTimeout(() => {
                this.debug('Here I am again, updating the message now…');
                this.renderMessage(page, payload).catch(error => {
                    this.debug(`Unable to update page: ${error}`);
                });
            }, response.validTill.getTime() - new Date().getTime());
        }
    }

    private async sendMessage(message: Message = new Message()): Promise<void> {
        const charArray = message.export();

        if(!this.subscriptionIds) {
            const subscriptions = await this.board.getSubscriptions();
            this.subscriptionIds = subscriptions.map(i => i._id);
        }

        this.debug('Sending Message:\n\n' + message.toString());

        await Promise.all(this.subscriptionIds.map(id => this.board.postMessage(id, charArray)));
    }
}
