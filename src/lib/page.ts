import Message from './message';

export interface PageRenderResponse {
    message: Message | null;
    validTill?: Date;
}

export default abstract class Page<PayloadType, ConfigType = Record<string, never>> {
    abstract parsePayload(payload: string | null): PayloadType;

    abstract parseConfig(key: string, value: string | null, config: Partial<ConfigType>): Partial<ConfigType>;

    abstract render(payload: PayloadType, config: ConfigType): Promise<PageRenderResponse>;
}
