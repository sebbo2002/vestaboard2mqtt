import Cache from '../cache.js';
import Message, { MessageWriteOptionsLine } from '../message.js';
import Page, { type PageRenderResponse } from '../page.js';

export default class MessagePage implements Page<string> {
    static readonly cache = new Cache('calendar');

    parseConfig(): Partial<Record<string, never>> {
        return {};
    }

    parsePayload(payload: null | string): string {
        return payload || '';
    }

    public async render(content: string): Promise<PageRenderResponse> {
        const message = new Message();

        content.split('\n').forEach((line) => {
            message.write(line, { line: MessageWriteOptionsLine.NEXT });
        });

        message.centerLines();
        message.center();
        return { message };
    }
}
