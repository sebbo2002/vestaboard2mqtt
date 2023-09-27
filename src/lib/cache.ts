import {join} from 'path';
import {existsSync} from 'fs';
import {promises} from 'fs';

type CacheData = Record<string, CacheNamespace>;
type CacheNamespace = Record<string, CacheItem>;
type CacheItem = CacheItemObject | CacheValue;
type CacheItemObject = {updated: number, value: CacheValue};
type CacheValue = unknown;

// as node@12 has no 'fs/promises'
const {readFile, writeFile} = promises;

export default class Cache {
    private static readonly file: string = join(process.env.HOME || '~', '.vestaboard2mqtt');
    private readonly namespace: string;
    private static currentFetch?: Promise<void>;
    private static currentData?: CacheData = {};

    constructor(namespace: string) {
        this.namespace = namespace;
    }

    static async fetch(): Promise<void> {
        if(this.currentFetch) {
            return this.currentFetch;
        }

        const fetch = this.fetchFromFile();
        this.currentFetch = fetch;
        return fetch;
    }

    static async fetchFromFile (): Promise<void> {
        if(!existsSync(this.file)) {
            return;
        }

        try {
            const content = await readFile(this.file, {encoding: 'utf8'});
            this.currentData = JSON.parse(content);
        }
        catch(error) {
            console.warn(`Unable to parse cache file: ${error}`);
        }
    }

    static isCacheItemObject(obj: CacheItem): obj is CacheItemObject {

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return typeof obj === 'object' && typeof obj.updated === 'number' && typeof obj.value !== 'undefined';
    }

    async get<T>(key: string, maxAge = 0): Promise<T | null> {
        await Cache.fetch();

        if(
            !Cache.currentData ||
            !Cache.currentData[this.namespace] ||
            !Cache.currentData[this.namespace][key]
        ) {
            return null;
        }

        const item = Cache.currentData[this.namespace][key];
        if(!Cache.isCacheItemObject(item) && maxAge > 0) {
            return null;
        }
        if(!Cache.isCacheItemObject(item)) {
            return item as T;
        }

        if(maxAge > 0 && new Date().getTime() - item.updated > maxAge) {
            return null;
        }

        return item.value as T;
    }

    async set(key: string, value: unknown): Promise<void> {
        await Cache.fetch();

        if(!Cache.currentData) {
            throw new Error('Unable to set value: currentData is empty!');
        }

        Cache.currentData[this.namespace] = Cache.currentData[this.namespace] || {};
        Cache.currentData[this.namespace][key] = {
            updated: new Date().getTime(),
            value
        };

        await Cache.save().catch(error => {
            console.warn(`Unable to update cache: ${error}`);
        });
    }

    async delete(key: string): Promise<void> {
        if(
            !Cache.currentData ||
            !Cache.currentData[this.namespace]
        ) {
            return;
        }

        delete Cache.currentData[this.namespace][key];

        if(Object.keys(Cache.currentData[this.namespace]).length === 0) {
            delete Cache.currentData[this.namespace];
        }

        await Cache.save().catch(error => {
            console.warn(`Unable to update cache: ${error}`);
        });
    }

    static async save(): Promise<void> {
        await writeFile(this.file, JSON.stringify(this.currentData, null, '    '));
    }
}
