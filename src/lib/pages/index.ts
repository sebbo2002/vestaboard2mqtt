import Page from '../page.js';
import MessagePage from './message.js';
import CalendarPage from './calendar.js';
import TodayPage from './today.js';

const pages: Record<string, Page<unknown, unknown>> = {
    message: new MessagePage(),
    calendar: new CalendarPage(),
    today: new TodayPage()
};

export default pages;
