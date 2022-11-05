/// <reference types="node" />
import { EventEmitter } from "events";
import { CacheIf } from "./interfaces";
export interface BSValue<DataType> {
    rt: Date;
    v: DataType;
    str: string;
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
    private readonly proxyMode;
    private readonly cache?;
    values: {
        [key: string]: BSValue<DataType>;
    };
    private syncTime;
    private syncType;
    constructor(proxyMode: boolean, cache?: CacheIf);
    init(): Promise<void>;
    keys(): string[];
    data(): {
        [key: string]: BSValue<DataType>;
    };
    array(): DataType[];
    set(k: string, v: DataType): void;
    get(id: any): DataType;
    debug(): {
        [key: string]: BSValue<DataType>;
    };
    getSyncState(): BSSyncState;
    getDataForSync(clientData: BSSyncState): string;
    pack(rt: Date, data: {
        [key: string]: BSValue<DataType>;
    }): string;
    setSyncItems(strData: string, bulk: boolean): void;
}
export {};
//# sourceMappingURL=dataSync.d.ts.map