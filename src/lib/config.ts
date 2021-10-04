import Cache from './cache';

export interface ConfigBoardData {
    id: string;
    key: string;
    secret: string;
    disabled: boolean;
}

export interface ConfigMQTTData {
    url: string;
    prefix: string;
}

export interface ConfigCalendarData {
    urls: Record<string, string>;
    cacheTTL: number;
}

export interface ConfigData {
    board: ConfigBoardData;
    mqtt: ConfigMQTTData;
    calendar: ConfigCalendarData;
}

export default class Config {
    private static readonly cache = new Cache('config');
    private static data?: ConfigData;

    public static get loaded(): boolean {
        return !!this.data && !!this.cache;
    }

    public static get board(): ConfigBoardData {
        if(this.loaded && this.data?.board) {
            return this.data.board;
        }

        throw new Error('Unable to access board config, is config loaded?');
    }

    public static get mqtt(): ConfigMQTTData {
        if(this.loaded && this.data?.mqtt) {
            return this.data.mqtt;
        }

        throw new Error('Unable to access mqtt config, is config loaded?');
    }

    public static get calendar(): ConfigCalendarData {
        if(this.loaded && this.data?.calendar) {
            return this.data.calendar;
        }

        throw new Error('Unable to access calendar config, is config loaded?');
    }

    public static async load(): Promise<void> {
        const data = await this.cache.get<ConfigData>('default');
        if(!data) {
            throw new Error('Unable to load configuration, try to run the setup script…');
        }

        this.data = data;
    }

    public static async save(data: ConfigData): Promise<void> {
        this.data = data;
        await this.cache.set('default', data);
    }

    public static async updateDisabled(newValue: boolean): Promise<void> {
        if(newValue === this.data?.board.disabled || !this.loaded || !this.data?.mqtt) {
            return;
        }

        this.data.board.disabled = newValue;
        await this.save(this.data);
    }
}
