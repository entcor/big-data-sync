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
    rt: Date;
    data: {[key: string]: string};
}

export class BigKVSync extends EventEmitter {
    private values: {[key: string]: BSValue} = {};
    private $onData: undefined | ((data: {[key: string]: BSValue}) => void);
    private syncTime: Date;

    constructor(private client: boolean) {
        super();
        this.syncTime = new Date(0);
        this.values = {};
        this.$onData = undefined;
    }

    set (k: string, v: any) {
        if (this.client) throw new Error('client can`t set data');

        const str = JSON.stringify(v);
        if (this.values[k] && str === this.values[k].str) return; // object is not changed 

        this.values[k] = {rt: new Date(), v, str};
        if (this.$onData) this.$onData({[k]: this.values[k].v});
    }

    debug() {
        return this.values;
    }

    onData(fn: (data: {[key: string]: any}) => void) {
        this.$onData = fn;
    }

    // получаем время последней синхронизации и то, что было синхронизировано после последней полной синхронизации
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

    setSyncItems(strData: string) {
        try {
            const {rt, data}: BSSyncItems = JSON.parse(strData);
            if (rt) this.syncTime = rt; // если нет rt - значит это отдельные параметры (поток)
            const evData: {[key: string]: BSValue} = {};
            Object.keys(data).forEach(key => {
                this.values[key] = { rt, v: data[key] };
                evData[key] = this.values[key].v;
            })
    
            if (this.$onData) this.$onData(evData);
        } catch (ex) {
            this.emit('error', ex.message);
        }
    }
}

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

