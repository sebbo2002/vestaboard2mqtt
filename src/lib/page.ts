import Message from './message.js';

export interface PageRenderResponse {
    message: Message | null;
    validTill?: Date;
}

export default abstract class Page<
    PayloadType,
    ConfigType = Record<string, never>,
> {
    abstract parseConfig(
        key: string,
        value: null | string,
        config: Partial<ConfigType>,
    ): Partial<ConfigType>;

    abstract parsePayload(payload: null | string): PayloadType;

    abstract render(
        payload: PayloadType,
        config: ConfigType,
    ): Promise<PageRenderResponse>;
}
