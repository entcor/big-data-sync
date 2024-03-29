/// <reference types="node" />
import { EventEmitter } from "events";
import { CacheIf } from "./interfaces";
export interface BSValue<DataType> {
    rt: Date;
    v: DataType;
    str: string;
    filteredStr: string;
    expire: Date;
}
export interface DataEvent<DataType> {
    data: {
        [key: string]: BSValue<DataType>;
    };
    rt: Date;
    bulk: boolean;
}
interface BSSyncState {
    rt: Date;
    data: {
        [key: string]: Date;
    };
}
export default class BDS<DataType> extends EventEmitter {
    readonly id: string;
    private readonly mode;
    private readonly cache?;
    private readonly fields;
    private readonly ttlCheckInterval;
    private readonly ttl;
    private $values;
    private syncTime;
    private syncType;
    private inited;
    constructor(id: string, mode: 'client' | 'server' | 'proxy', cache?: CacheIf, fields?: string[], ttlCheckInterval?: number, ttl?: number);
    private get filtered();
    get $cache(): CacheIf;
    checkTTL(): void;
    init(): Promise<void>;
    keys(): string[];
    data(): {
        [key: string]: BSValue<DataType>;
    };
    array(): DataType[];
    values(): {
        [key: string]: DataType;
    };
    getExpireTime(ttl: number, date?: Date): Date;
    set(k: string, v: DataType, ttl?: number): void;
    setBulk(data: {
        [key: string]: DataType;
    }, ttl: number): void;
    get(id: string): DataType;
    debug(): {
        [key: string]: BSValue<DataType>;
    };
    getSyncState(): BSSyncState;
    getDataForSync(clientData: BSSyncState): string;
    pack(rt: Date, data: {
        [key: string]: BSValue<DataType>;
    }): string;
    setSyncItems(strData: string, bulk: boolean): boolean;
}
export {};
//# sourceMappingURL=dataSync.d.ts.map