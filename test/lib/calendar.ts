'use strict';

import * as assert from 'assert';

import CalendarPage from '../../src/lib/pages/calendar.js';

describe('Calendar', function () {
    describe('isSameDay()', function () {
        it('should work (1)', function () {
            const a = new Date();
            const b = new Date();

            assert.equal(CalendarPage.isSameDay(a, b), true);
        });
        it('should work (2)', function () {
            const a = new Date('2022-01-10T10:35:00.000Z');
            const b = new Date('2022-02-10T10:35:00.000Z');

            assert.equal(CalendarPage.isSameDay(a, b), false);
        });
    });
});
