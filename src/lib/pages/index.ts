import Page from '../page';
import MessagePage from './message';
import CalendarPage from './calendar';
import TodayPage from './today';

const pages: Record<string, Page<unknown, unknown>> = {
    message: new MessagePage(),
    calendar: new CalendarPage(),
    today: new TodayPage()
};

export default pages;
