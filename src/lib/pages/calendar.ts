import Cache from '../cache.js';
import Page, { type PageRenderResponse } from '../page.js';
import Message, {MessageWriteOptionsLine } from '../message.js';
import ical, { type VEvent } from 'node-ical';
import Config from '../config.js';
import TodayPage, { type TodayPagePayload } from './today.js';


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
            const events = Object.values(calendar)
                .filter(entry =>
                    entry.type === 'VEVENT' &&
                    entry.start &&
                    entry.end &&
                    entry.summary
                ) as VEvent[];
            preCached = events
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
        const result = Boolean(
            a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate()
        );

        return result;
    }

    public static isMidnight (date: Date): boolean {
        const result = Boolean(
            !date.getHours() &&
            !date.getMinutes() &&
            !date.getSeconds() &&
            !date.getMilliseconds()
        );

        return result;
    }

    public async fetchURLs(urls: string[]): Promise<CalendarPageItem[]> {
        const rawResult: {start: Date, end: Date, summary: string}[][] = await Promise.all(urls.map(url => this.fetchURL(url)));
        return ([] as CalendarPageItem[])
            .concat(...rawResult)
            .filter(entry => entry.end > new Date())
            .sort((a, b) => a.end.getTime() - b.end.getTime());
    }

    public static getTimeStr (event: CalendarPageItem, oneLine = false): string {
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
            return oneLine ? 'Morgen' : 'Morgn';
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
            .then(calendar => calendar.filter(entry => {
                if (CalendarPage.isMidnight(entry.start) && CalendarPage.isMidnight(entry.end)) {
                    return CalendarPage.isSameDay(new Date(), entry.start) || (
                        new Date().getHours() >= 20 &&
                        CalendarPage.isSameDay(new Date(new Date().getTime() + 1000 * 60 * 60 * 24), entry.start)
                    );
                } else {
                    return entry.start < new Date(new Date().getTime() + (1000 * 60 * 60 * 12));
                }
            }));

        if(!calendar.length) {
            const today = new TodayPage();
            const pageConfigCache = new Cache('page-config');
            const config = await pageConfigCache.get<Partial<TodayPagePayload>>('today');
            return today.render({}, config || {});
        }

        let validTill = new Date(new Date().getTime() + 1000 * 60 * 10);
        calendar.forEach(event => {
            message.write(
                CalendarPage.getTimeStr(event, calendar.length === 1),
                {line: MessageWriteOptionsLine.NEXT}
            );

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
