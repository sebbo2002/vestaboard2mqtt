'use strict';

import Cache from '../../src/lib/cache.js';
import * as assert from 'assert';

describe('Cache', function () {
    describe('set() / get() / delete()', function () {
        it('should work', async function () {
            const cache = new Cache('tests');

            assert.strictEqual(await cache.get<string>('test'), null);

            await cache.set('test', 'foo');
            assert.strictEqual(await cache.get<string>('test'), 'foo');

            await cache.delete('test');
        });
    });
});
