import { EventEmitter } from "events";
import { CacheIf } from "./interfaces";
const splitter = '#@%@#';

// realTimeSync: server (set) => send to client (clnt.setFromServer()) => client.onData()
// при изменени параметра - сервер передаст изменение на клиент

// sliceSync onTimer: clent.getSyncState() => send to server => server generate differences => send to client

// на случай отсутствия связи или ошибок нет уверенности в том, что данные синхронны
// в этом случае клиент передает серверу последнее время синхронизации и времена всех 
// синхронизированных поле этого времени параметров
// сервверр проверить и выберет все параметры, которые имеют время обновления после последнего 
// времени синхронизации и не входят в присланный клиентом список 

export interface BSValue {
    rt: Date,
    v: any
    str: string,
};

export interface DataEvent {
  data: {[key: string]: BSValue};
  rt: Date,
  bulk: boolean,
}

interface BSSyncState {
    rt: Date;
    data: {[key: string]: boolean};
}

export default class BDS extends EventEmitter {
  values: {[key: string]: BSValue} = {};
  private syncTime: Date;

  constructor(
    private readonly proxyMode: boolean,
    private readonly cache?: CacheIf,
  ) {
    super();
    this.syncTime = new Date(0);
    this.values = {};
  }

  async init() {
    if (this.cache) {
      const data = await this.cache.restore();
      Object.keys(data).forEach(key => {
        this.values[key] = {
          rt: data[key].rt,
          v: !this.proxyMode && JSON.parse(data[key].str),
          str: data[key].str,
        };
      })
    }
  }

  keys(): string[] {
    return Object.keys(this.values);
  }

  set (k: string, v: any) {
    const str = v === undefined ? undefined : JSON.stringify(v);
    if ((!this.values[k] && !str) || ( this.values[k] && str === this.values[k].str)) return; // object is not changed

    const now = new Date();
    this.values[k] = {rt: now, v, str};
    if (!v) {
      this.emit("delete", k, this.values[k]);
      delete this.values[k];
      if (this.cache) this.cache.delete(k);
      return;
    }

    if (this.cache) this.cache.set(k, now, str).catch(console.error);
    this.emit("data", {
      data: {[k]: { str, v } || null},
      rt: now,
      bulk: false,
    } as DataEvent);
  }

  debug() {
    return this.values;
  }

  // метод клиента
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

  // метод сервера
  // принятие рещение о недостающих элементах на основании состоянии клиента
  getDataForSync(clientData: BSSyncState): string {
    const strItems = []; 
    Object.keys(this.values)
      .forEach((key) => {
        if (this.values[key].rt > clientData.rt || !clientData.data[key]) {
          strItems.push(`${key}${splitter}${this.values[key].str}`);
        }
      });

    // rt###key1###value1###key2###value2 ..........
    return `${(new Date()).toISOString()}${splitter}${strItems.join(splitter)}`;
  }

  public pack(rt: Date, data: {[key: string]: BSValue}) {
    const strItems = [];
    Object.keys(data || {}).forEach(key => {
      const $str = data[key]?.str;
      strItems.push(`${key}${splitter}${$str}`);
    }) 
    return `${(rt).toISOString()}${splitter}${strItems.join(splitter)}`;
  }

  // метод клиента
  // межсерверная синхронизация (bulk - срезовая)
  setSyncItems(strData: string, bulk: boolean) {
    try {
      const items = strData.split(splitter).filter(el => !!el);
      const rt = new Date(items.shift());

      const data = {};
      for (let i=0; i < items.length; i += 2) {
        data[items[i]] = items[i+1] === 'undefined' ? null : {
          str: items[i+1],
          v: this.proxyMode ? undefined : JSON.parse(items[i+1]),
        }
      }

      if (bulk) this.syncTime = rt;

      const evData: DataEvent = { data: {}, rt, bulk };
      Object.keys(data).forEach(key => {
        if (data[key] === null) {
          const $val = this.values[key];

          if ($val) {
            delete this.values[key];
            this.emit("delete", key, $val.v);
            this.cache.delete(key);
          }
        } else {
          this.values[key] = data[key];
          evData.data[key] = { rt, ...data[key] };
        }
      })
      
      if (bulk) { // синхронизация куска данных - надо удалить все старое что не пришло - значит удалено
        for (const key in this.values) {
          if (this.values[key].rt < rt) {
            const $val = this.values[key];
            delete this.values[key];
            this.emit("delete", key, $val.v );
            if (this.cache) this.cache.delete(key);
          }
        }
      }

      if (this.cache) {
        Object.keys(evData.data).forEach(key => {
          this.cache.set(key, evData.data[key].rt, evData.data[key].str);
        })
      }

      if (Object.keys(evData.data).length) this.emit("data", evData );
    } catch (ex) {
      this.emit('error', ex.message);
    }
  }
}
