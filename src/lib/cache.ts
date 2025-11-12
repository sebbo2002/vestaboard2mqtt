import { existsSync } from 'fs';
import { promises } from 'fs';
import { join } from 'path';

type CacheData = Record<string, CacheNamespace>;
type CacheItem = CacheItemObject | CacheValue;
type CacheItemObject = { updated: number; value: CacheValue };
type CacheNamespace = Record<string, CacheItem>;
type CacheValue = unknown;

// as node@12 has no 'fs/promises'
const { readFile, writeFile } = promises;

export default class Cache {
    private static currentData?: CacheData = {};
    private static currentFetch?: Promise<void>;
    private static readonly file: string = join(
        process.env.HOME || '~',
        '.vestaboard2mqtt',
    );
    private readonly namespace: string;

    constructor(namespace: string) {
        this.namespace = namespace;
    }

    static async fetch(): Promise<void> {
        if (this.currentFetch) {
            return this.currentFetch;
        }

        const fetch = this.fetchFromFile();
        this.currentFetch = fetch;
        return fetch;
    }

    static async fetchFromFile(): Promise<void> {
        if (!existsSync(this.file)) {
            return;
        }

        try {
            const content = await readFile(this.file, { encoding: 'utf8' });
            this.currentData = JSON.parse(content);
        } catch (error) {
            console.warn(`Unable to parse cache file: ${error}`);
        }
    }

    static isCacheItemObject(obj: CacheItem): obj is CacheItemObject {
        return (
            obj !== null &&
            typeof obj === 'object' &&
            'updated' in obj &&
            typeof obj.updated === 'number' &&
            'value' in obj &&
            typeof obj.value !== 'undefined'
        );
    }

    static async save(): Promise<void> {
        await writeFile(
            this.file,
            JSON.stringify(this.currentData, null, '    '),
        );
    }

    async delete(key: string): Promise<void> {
        if (!Cache.currentData || !Cache.currentData[this.namespace]) {
            return;
        }

        delete Cache.currentData[this.namespace][key];

        if (Object.keys(Cache.currentData[this.namespace]).length === 0) {
            delete Cache.currentData[this.namespace];
        }

        await Cache.save().catch((error) => {
            console.warn(`Unable to update cache: ${error}`);
        });
    }

    async get<T>(key: string, maxAge = 0): Promise<null | T> {
        await Cache.fetch();

        if (
            !Cache.currentData ||
            !Cache.currentData[this.namespace] ||
            !Cache.currentData[this.namespace][key]
        ) {
            return null;
        }

        const item = Cache.currentData[this.namespace][key];
        if (!Cache.isCacheItemObject(item) && maxAge > 0) {
            return null;
        }
        if (!Cache.isCacheItemObject(item)) {
            return item as T;
        }

        if (maxAge > 0 && new Date().getTime() - item.updated > maxAge) {
            return null;
        }

        return item.value as T;
    }

    async set(key: string, value: unknown): Promise<void> {
        await Cache.fetch();

        if (!Cache.currentData) {
            throw new Error('Unable to set value: currentData is empty!');
        }

        Cache.currentData[this.namespace] =
            Cache.currentData[this.namespace] || {};
        Cache.currentData[this.namespace][key] = {
            updated: new Date().getTime(),
            value,
        };

        await Cache.save().catch((error) => {
            console.warn(`Unable to update cache: ${error}`);
        });
    }
}
