import { EventEmitter } from "stream";

// realTimeSync: server (set) => send to client (clnt.setFromServer()) => client.onData()
// при изменени параметра - сервер передаст изменение на клиент

// sliceSync onTimer: clent.getSyncState() => send to server => server generate differences => send to client

// на случай отсутствия связи или ошибок нет уверенности в том, что данные синхронны
// в этом случае клиент передает серверу последнее время синхронизации и времена всех 
// синхронизированных поле этого времени параметров
// сервверр проверить и выберет все параметры, которые имеют время обновления после последнего 
// времени синхронизации и не входят в присланный клиентом список 

interface BSValue {
    rt: Date,
    v: any
    str?: string,
};

interface BSSyncState {
    rt: Date;
    data: {[key: string]: boolean};
}

interface BSSyncItems {
    bulk: boolean;
    rt: Date;
    data: {[key: string]: string};
}

export class BigKVSync extends EventEmitter {
    values: {[key: string]: BSValue} = {};
    private $onData: undefined | ((data: {[key: string]: BSValue}, rt: Date) => void);
    private $onDelete: undefined | ((key: string, data: {[key: string]: BSValue}) => void);
    private syncTime: Date;

    constructor(private client: boolean) {
        super();
        this.syncTime = new Date(0);
        this.values = {};
        this.$onData = undefined;
    }

    set (k: string, v: any) {
        if (this.client) throw new Error('client can`t set data');

        const str = v === undefined ? undefined : JSON.stringify(v);
        if (this.values[k] && str === this.values[k].str) return; // object is not changed 

        const now = new Date();
        this.values[k] = {rt: now, v, str};
        if (!v) delete this.values[k];
        if (this.$onData) this.$onData({[k]: v || null}, now);
    }

    debug() {
        return this.values;
    }

    onData(fn: (data: {[key: string]: any}, rt: Date) => void) { this.$onData = fn; }
    onDelete(fn: (key: string, data: {[key: string]: any}) => void) { this.$onDelete = fn; }

    // получаем время последней синхронизации и то, что было синхронизировано после последней полной синхронизации
    // выполняет клиент
    getSyncState(): BSSyncState {
        const syncRtList = Object.keys(this.values)
            .reduce((prev, key) => {
                if (this.values[key].rt > this.syncTime) prev[key] = 1;
                return prev;
            }, {} as any);

        return {
            rt: this.syncTime,
            data: syncRtList,
        }
    }

    getDataForSync(clientData: BSSyncState): string {
        const strItems = []; 
        Object.keys(this.values)
            .forEach((key) => {
                if (this.values[key].rt > clientData.rt || !clientData.data[key]) {
                    strItems.push(`"${key}":${this.values[key].str}`)
                }
            });

        return `{"rt":"${new Date()}","data":{${strItems.join(',')}}}`;
    }

    setSyncItems(strData: string, bulk: boolean) {
        try {
            const {rt, data}: BSSyncItems = JSON.parse(strData);
            if (bulk) this.syncTime = rt;

            const evData: {[key: string]: BSValue} = {};
            Object.keys(data).forEach(key => {
                if (data[key] === null && this.values[key]) {
                    const $val = this.values[key];
                    delete this.values[key];
                    if (this.$onDelete) this.$onDelete(key, $val.v);
                } else {
                    this.values[key] = { rt, v: data[key] };
                    evData[key] = this.values[key].v;
                }
            })
            
            if (bulk) { // синхронизация куска данных - надо удалить все старое что не пришло - значит удалено
                for (const key in this.values) {
                    if (this.values[key].rt < rt) {
                        const $val = this.values[key];
                        delete this.values[key];
                        if (this.$onDelete) this.$onDelete(key, $val.v);
                    }
                }
            }

            if (this.$onData && Object.keys(evData).length) this.$onData(evData, rt);
        } catch (ex) {
            this.emit('error', ex.message);
        }
    }
}
