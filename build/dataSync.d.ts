/// <reference types="node" />
import { EventEmitter } from "events";
import { CacheIf } from "./interfaces";
export interface BSValue {
    rt: Date;
    v: any;
    str: string;
}
export interface DataEvent {
    data: {
        [key: string]: BSValue;
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
export default class BDS extends EventEmitter {
    private readonly proxyMode;
    private readonly cache?;
    values: {
        [key: string]: BSValue;
    };
    private syncTime;
    private syncType;
    constructor(proxyMode: boolean, cache?: CacheIf);
    init(): Promise<void>;
    keys(): string[];
    data(): {};
    array(): any[];
    set(k: string, v: any): void;
    debug(): {
        [key: string]: BSValue;
    };
    getSyncState(): BSSyncState;
    getDataForSync(clientData: BSSyncState): string;
    pack(rt: Date, data: {
        [key: string]: BSValue;
    }): string;
    setSyncItems(strData: string, bulk: boolean): void;
}
export {};
//# sourceMappingURL=dataSync.d.ts.map