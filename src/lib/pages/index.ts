import Page from '../page.js';
import CalendarPage from './calendar.js';
import MessagePage from './message.js';
import TodayPage from './today.js';

const pages: Record<string, Page<unknown, unknown>> = {
    calendar: new CalendarPage(),
    message: new MessagePage(),
    today: new TodayPage(),
};

export default pages;
