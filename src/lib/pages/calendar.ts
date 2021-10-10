import Cache from '../cache';
import Page, {PageRenderResponse} from '../page';
import Message, {MessageWriteOptionsLine} from '../message';
import ical from 'node-ical';
import Config from '../config';
import TodayPage, {TodayPagePayload} from './today';


export interface CalendarPagePayload {
    calendars: string[];
}

export type CalendarPageItem = {start: Date, end: Date, summary: string};

export default class CalendarPage implements Page<CalendarPagePayload> {
    static readonly cache = new Cache('calendar');

    public parsePayload(payload: string | null): CalendarPagePayload {
        return {
            calendars: (payload || '').split(',')
        };
    }

    parseConfig(): Partial<Record<string, never>> {
        return {};
    }

    public async fetchURL(url: string): Promise<CalendarPageItem[]> {
        let preCached = await CalendarPage.cache.get<CalendarPageItem[]>(url, 1000 * 60 * 10);
        if(!preCached) {
            const calendar = await ical.async.fromURL(url);
            preCached = Object.values(calendar)
                .filter(entry =>
                    entry.type === 'VEVENT' &&
                    entry.start &&
                    entry.end &&
                    entry.summary
                )
                .map(entry => ({
                    start: new Date(String(entry.start)),
                    end: new Date(String(entry.end)),
                    summary: String(entry.summary).trim()
                }))
                .filter(entry => entry.end > new Date())
                .sort((a, b) => a.end.getTime() - b.end.getTime())
                .slice(0, 6);

            await CalendarPage.cache.set(url, preCached);
        }

        return preCached
            .map(entry => ({
                start: new Date(String(entry.start)),
                end: new Date(String(entry.end)),
                summary: String(entry.summary)
            }))
            .filter(entry =>
                entry.end > new Date()
            );
    }

    public static isSameDay (a: Date, b: Date): boolean {
        const h1 = a.getHours() - a.getTimezoneOffset() / 60;
        const h2 = b.getHours() - b.getTimezoneOffset() / 60;

        const dateA = a.getDate() + (h1 >= 24? 1: 0);
        const dateB = b.getDate() + (h2 >= 24? 1: 0);

        return dateA === dateB;
    }

    public static isMidnight (date: Date) {
        return Boolean(
            !date.getHours() &&
            !date.getMinutes() &&
            !date.getSeconds() &&
            !date.getMilliseconds()
        );
    }

    public async fetchURLs(urls: string[]): Promise<CalendarPageItem[]> {
        const rawResult: {start: Date, end: Date, summary: string}[][] = await Promise.all(urls.map(url => this.fetchURL(url)));
        const mergedResult = ([] as CalendarPageItem[])
            .concat(...rawResult)
            .filter(entry => entry.end > new Date())
            .sort((a, b) => a.end.getTime() - b.end.getTime());

        return mergedResult;
    }

    public static getTimeStr (event: CalendarPageItem): string {
        if(
            this.isMidnight(event.start) &&
            this.isMidnight(event.end) &&
            this.isSameDay(new Date(), event.start)
        ) {
            return 'Heute';
        }
        if(
            this.isMidnight(event.start) &&
            this.isMidnight(event.end) &&
            this.isSameDay(new Date(new Date().getTime() + 1000 * 60 * 60 * 24), event.start)
        ) {
            return 'Morgn';
        }

        return event.start.getHours().toString().padStart(2, '⬛️') + ':' +
            event.start.getMinutes().toString().padStart(2, '0');
    }

    public async render (payload: CalendarPagePayload): Promise<PageRenderResponse> {
        const message = new Message();
        const urls = payload.calendars
            .map(id => Config.calendar.urls[id])
            .filter(Boolean);

        const calendar = await this.fetchURLs(urls)
            .then(calendar => calendar.filter(entry =>
                entry.start < new Date(new Date().getTime() + (1000 * 60 * 60 * 12))
            ));

        if(!calendar.length) {
            const today = new TodayPage();
            const pageConfigCache = new Cache('page-config');
            const config = await pageConfigCache.get<Partial<TodayPagePayload>>('today');
            return today.render({}, config || {});
        }

        let validTill = new Date(new Date().getTime() + 1000 * 60 * 10);
        calendar.forEach(event => {
            message.write(CalendarPage.getTimeStr(event), {line: MessageWriteOptionsLine.NEXT});
            message.write(event.summary, {line: MessageWriteOptionsLine.CURRENT, row: 6});

            message.write('', {line: MessageWriteOptionsLine.NEXT});

            if(event.end < validTill) {
                validTill = event.end;
            }
        });

        message.center();
        return {
            message,
            validTill
        };
    }
}
