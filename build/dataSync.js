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
        const str = JSON.stringify(v);
        if (this.values[k] && str === this.values[k].str)
            return; // object is not changed 
        this.values[k] = { rt: new Date(), v, str };
        if (this.$onData)
            this.$onData({ [k]: this.values[k].v });
    }
    debug() {
        return this.values;
    }
    onData(fn) {
        this.$onData = fn;
    }
    // получаем время последней синхронизации и то, что было синхронизировано после последней полной синхронизации
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
    setSyncItems(strData) {
        try {
            const { rt, data } = JSON.parse(strData);
            if (rt)
                this.syncTime = rt; // если нет rt - значит это отдельные параметры (поток)
            const evData = {};
            Object.keys(data).forEach(key => {
                this.values[key] = { rt, v: data[key] };
                evData[key] = this.values[key].v;
            });
            if (this.$onData)
                this.$onData(evData);
        }
        catch (ex) {
            this.emit('error', ex.message);
        }
    }
}
exports.BigKVSync = BigKVSync;
// function testCall() {
//     console.log('start sync');
//     const srv  = new BigKVSync(false);
//     const clnt = new BigKVSync(true);
//     // data  = { key: value, key: value, .... }
//     srv.onData(data => clnt.setItems(data));
//     clnt.onData(data => console.log(data));
//     setInterval(() => {
//         srv.set(`data$${Math.round(Math.random()*100)}`, { data: Math.random() })
//         setTimeout(() => {
//             console.log('server:', srv.debug() );
//             console.log('client:', clnt.debug() );
//         }, 500)
//     }, 5000);
//     setInterval(() => {
//         const syncState = clnt.getSyncState(); // читаем у клиента состояние для отправки на сервер
//         const syncData = srv.getDataForSync(syncState); // читаем данные для синхронизции у сервера
//         clnt.setSyncItems(syncData); // записываем данные на клиента
//     }, 30 * 1000);
// }
// testCall();
//# sourceMappingURL=dataSync.js.map