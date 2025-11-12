import Cache from '../cache.js';
import Message, { MessageWriteOptionsLine } from '../message.js';
import Page, { type PageRenderResponse } from '../page.js';

export interface TodayPagePayload {
    locale: string;
    precip?: number;
    temp?: [number, number];
}

export default class TodayPage
    implements Page<Partial<TodayPagePayload>, TodayPagePayload>
{
    static readonly cache = new Cache('calendar');

    parseConfig(
        key: string,
        value: null | string,
        config: Partial<TodayPagePayload>,
    ): Partial<TodayPagePayload> {
        const result: Partial<TodayPagePayload> = {};
        console.log('parseConfig', config);

        if (key === 'min-temp' && Array.isArray(config.temp)) {
            result.temp = [parseInt(value || ''), Math.max(...config.temp)];
        } else if (key === 'min-temp') {
            result.temp = [parseInt(value || ''), parseInt(value || '')];
        } else if (key === 'max-temp' && Array.isArray(config.temp)) {
            result.temp = [Math.min(...config.temp), parseInt(value || '')];
        } else if (key === 'max-temp') {
            result.temp = [parseInt(value || ''), parseInt(value || '')];
        } else if (key === 'precip') {
            result.precip = parseInt(value || '', 10);
        } else if (key === 'locale') {
            result.locale = String(value);
        }

        return result;
    }

    parsePayload(payload: null | string): Partial<TodayPagePayload> {
        try {
            return JSON.parse(payload || '') as Partial<TodayPagePayload>;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            return {};
        }
    }

    public async render(
        payload: Partial<TodayPagePayload>,
        config: Partial<TodayPagePayload>,
    ): Promise<PageRenderResponse> {
        const message = new Message();
        const today = new Date();

        const mergedPayload: TodayPagePayload = Object.assign(
            {
                locale: 'en',
                precip: undefined,
                temp: undefined,
            },
            config,
            payload,
        );

        message.write(
            today.toLocaleString(mergedPayload.locale, { weekday: 'long' }),
        );
        message.write(
            today.toLocaleString(mergedPayload.locale, {
                day: 'numeric',
                month: 'long',
            }),
            { line: MessageWriteOptionsLine.NEXT },
        );

        message.write('', { line: MessageWriteOptionsLine.NEXT });

        const varContent = [];
        if (Array.isArray(mergedPayload.temp)) {
            varContent.push(
                `${Math.min(...mergedPayload.temp)}-${Math.max(...mergedPayload.temp)}°C`,
            );
        }
        if (
            typeof mergedPayload.precip === 'number' &&
            mergedPayload.precip > 0
        ) {
            varContent.push(`${mergedPayload.precip}%`);
        }
        if (varContent.length) {
            message.write(varContent.join(', '), {
                line: MessageWriteOptionsLine.NEXT,
            });
        }

        message.center();

        const validTill = new Date();
        validTill.setHours(24, 0, 0, 0);

        return { message, validTill };
    }
}
