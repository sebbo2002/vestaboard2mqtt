import Cache from '../cache.js';
import Page, {PageRenderResponse} from '../page.js';
import Message, {MessageWriteOptionsLine} from '../message.js';


export default class MessagePage implements Page<string> {
    static readonly cache = new Cache('calendar');

    parsePayload(payload: string | null): string {
        return payload || '';
    }

    parseConfig(): Partial<Record<string, never>> {
        return {};
    }

    public async render (content: string): Promise<PageRenderResponse> {
        const message = new Message();

        content.split('\n').forEach(line => {
            message.write(line, {line: MessageWriteOptionsLine.NEXT});
        });

        message.centerLines();
        message.center();
        return {message};
    }
}
