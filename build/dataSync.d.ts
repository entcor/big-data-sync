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
        [key: string]: boolean;
    };
}
export default class BDS extends EventEmitter {
    private readonly proxyMode;
    private readonly cache?;
    values: {
        [key: string]: BSValue;
    };
    private syncTime;
    constructor(proxyMode: boolean, cache?: CacheIf);
    init(): Promise<void>;
    keys(): string[];
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