"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BigKVSync = void 0;
const stream_1 = require("stream");
;
class BigKVSync extends stream_1.EventEmitter {
    constructor(client) {
        super();
        this.client = client;
        this.values = {};
        this.syncTime = new Date(0);
        this.values = {};
        this.$onData = undefined;
    }
    set(k, v) {
        if (this.client)
            throw new Error('client can`t set data');
        const str = v === undefined ? undefined : JSON.stringify(v);
        if (this.values[k] && str === this.values[k].str)
            return; // object is not changed 
        const now = new Date();
        this.values[k] = { rt: now, v, str };
        if (!v)
            delete this.values[k];
        if (this.$onData)
            this.$onData({ [k]: v || null }, now);
    }
    debug() {
        return this.values;
    }
    onData(fn) { this.$onData = fn; }
    onDelete(fn) { this.$onDelete = fn; }
    // получаем время последней синхронизации и то, что было синхронизировано после последней полной синхронизации
    // выполняет клиент
    getSyncState() {
        const syncRtList = Object.keys(this.values)
            .reduce((prev, key) => {
            if (this.values[key].rt > this.syncTime)
                prev[key] = 1;
            return prev;
        }, {});
        return {
            rt: this.syncTime,
            data: syncRtList,
        };
    }
    getDataForSync(clientData) {
        const strItems = [];
        Object.keys(this.values)
            .forEach((key) => {
            if (this.values[key].rt > clientData.rt || !clientData.data[key]) {
                strItems.push(`"${key}":${this.values[key].str}`);
            }
        });
        return `{"rt":"${new Date()}","data":{${strItems.join(',')}}}`;
    }
    setSyncItems(strData, bulk) {
        try {
            const { rt, data } = JSON.parse(strData);
            if (bulk)
                this.syncTime = rt;
            const evData = {};
            Object.keys(data).forEach(key => {
                if (data[key] === null && this.values[key]) {
                    const $val = this.values[key];
                    delete this.values[key];
                    if (this.$onDelete)
                        this.$onDelete(key, $val.v);
                }
                else {
                    this.values[key] = { rt, v: data[key] };
                    evData[key] = this.values[key].v;
                }
            });
            if (bulk) { // синхронизация куска данных - надо удалить все старое что не пришло - значит удалено
                for (const key in this.values) {
                    if (this.values[key].rt < rt) {
                        const $val = this.values[key];
                        delete this.values[key];
                        if (this.$onDelete)
                            this.$onDelete(key, $val.v);
                    }
                }
            }
            if (this.$onData && Object.keys(evData).length)
                this.$onData(evData, rt);
        }
        catch (ex) {
            this.emit('error', ex.message);
        }
    }
}
exports.BigKVSync = BigKVSync;
//# sourceMappingURL=dataSync.js.map