import { EventEmitter } from "events";
import { CacheIf } from "./interfaces";
import TagLogger from 'etaglogger';
const splitter = '#@%@#';

const logd = TagLogger('BDS');

// realTimeSync: server (set) => send to client (clnt.setFromServer()) => client.onData()
// при изменени параметра - сервер передаст изменение на клиент

// sliceSync onTimer: clent.getSyncState() => send to server => server generate differences => send to client

// на случай отсутствия связи или ошибок нет уверенности в том, что данные синхронны
// в этом случае клиент передает серверу последнее время синхронизации и времена всех 
// синхронизированных поле этого времени параметров
// сервверр проверить и выберет все параметры, которые имеют время обновления после последнего 
// времени синхронизации и не входят в присланный клиентом список 


// выбрасываем не нужные поля + сортируем
// filtered - значит объект для проверки изменений отличается от сохряняемого объекта
function pickAndSort(obj: any = {}, fields) {
  const filtered = !!fields?.length;
  if (!obj) return { obj: undefined, strObj: undefined, filtered };

  const $fields = (filtered ? fields : Object.keys(obj)).sort();
  const res = {};
  $fields.forEach(key => res[key] = obj[key]);
  return {obj: res, strObj: JSON.stringify(res), filtered };
}

export interface BSValue<DataType> {
    rt: Date,
    v: DataType,
    str: string,
    filteredStr: string,
    expire: Date,
};

export interface DataEvent<DataType> {
  data: {[key: string]: BSValue<DataType>};
  rt: Date,
  bulk: boolean,
}

interface BSSyncState {
    rt: Date;
    data: {[key: string]: Date};
}

export default class BDS<DataType> extends EventEmitter {
  private $values: {[key: string]: BSValue<DataType>} = {};
  private syncTime: Date;
  private syncType = 'full';
  private inited = false;

  constructor(
    readonly id: string,
    private readonly mode: 'client' | 'server' | 'proxy',
    private readonly cache?: CacheIf,
    private readonly fields: string[] = [],
    private readonly ttlCheckInterval: number = 0,
  ) {
    super();    
    this.syncTime = new Date(0);
    this.$values = {};

    if (this.ttlCheckInterval) {
      setInterval (() => this.checkTTL(), ttlCheckInterval * 1000);
    }
  }

  private get filtered() {
    return this.fields?.length > 0;
  }

  get $cache() {
    return this.cache;
  }

  checkTTL() {
    const now = new Date();
    Object.keys(this.$values).forEach((key: string) => {
      const $data = this.$values[key];
      if ($data.expire && $data.expire > now) {
        delete this.$values[key];
        if (this.cache) this.cache.delete(key); 
      }
    })
  }

  async init(): Promise<void> {
    this.inited = false;

    if (this.cache) {
      const data = await this.cache.restore();
      Object.keys(data).forEach(key => {
        if (data[key].str !== 'false') {
          this.$values[key] = {
            rt: data[key].rt,
            v: this.mode !== 'proxy' && JSON.parse(data[key].str),
            str: this.mode !== 'client' && data[key].str,
            filteredStr: this.mode !== 'client' && data[key].filteredStr,
            expire: data[key].expire,
          };
        }
      })
    }
    this.inited = true;
  }

  keys(): string[] {
    return Object.keys(this.$values);
  }

  data(): {[key: string]: BSValue<DataType>} {
    return Object.keys(this.$values).reduce((agg, key) => {
      agg[key] = this.$values[key].v;
      return agg;
    }, {});
  }

  array(): DataType[] {
    return Object.values(this.$values).map(el => el.v);
  }

  values(): {[key: string]: DataType} {
    return Object.keys(this.$values).reduce((acc, key) => { acc[key] = this.$values[key].v; return acc; }, {});
  }

  set(k: string, v: DataType, ttl?: number): void {
    if (!v) v = undefined;
    const compareObj = pickAndSort(v, this.fields);
    const now = new Date();

    logd(`bds(${this.id}) => set`, k);

    if ((!this.$values[k] && !compareObj.strObj) || (this.$values[k] && compareObj.strObj === this.$values[k].filteredStr)) {
      // тут странно - не знаю как правильно но если фильтрующие поля не поменялись -> значение объекта все равно меняем (но толлько локально)
      
      if (!this.$values[k] && v) this.$values[k] = { rt: now, v, str: undefined, filteredStr: undefined, expire: new Date((new Date).getTime() + ttl * 1000) };
      else { this.$values[k].v = v; this.$values[k].rt = now; }
      return; // object is not changed
    }

    const str = compareObj.filtered ? JSON.stringify(v) : compareObj.strObj;
    const filteredStr = this.filtered ? compareObj.strObj : undefined;

    this.$values[k] = {
      rt: now, v, str,
      filteredStr,
      expire: new Date((new Date).getTime() + ttl * 1000),
    };

    if (!v) {
      this.emit("delete", k, this.$values[k]);
      delete this.$values[k];
      if (this.cache) this.cache.delete(k);
      return;
    }

    if (this.cache) this.cache.set(k, now, str, filteredStr);
    this.emit("data", {
      data: {[k]: { str, v } || null},
      rt: now,
      bulk: false,
    } as DataEvent<DataType>);
  }

  setBulk(data: {[key:string]: DataType}, ttl: number): void {
    Object.keys(data).forEach(key => this.set(key, data[key], ttl));
  }

  get (id: string): DataType {
    return this.$values[id]?.v;
  }

  debug() {
    return this.$values;
  }

  // метод клиента
  // получаем время последней синхронизации и то, что было синхронизировано после последней полной синхронизации
  // server=>client (getSyncState) => client=>server(response), server => send changes 
  getSyncState(): BSSyncState {

    logd(`bds(${this.id}) => getSyncState(start)`)

    // полная синхронизация: {rt: sync Time, data: { key: rt, key2: rt }}
    // т.е. получаем полный список всех элементов хранилищя с их временем изменения
    if (this.syncType === 'full') {
      const syncRtList = Object.keys(this.$values)
          .reduce((prev, key) => {
              prev[key] = this.$values[key].rt;
              return prev;
          }, {} as any);

        logd(`bds(${this.id}) => getSyncState(finish)`, () => `count=${Object.keys(syncRtList).length}`);
        
        return {
            rt: this.syncTime,
            data: syncRtList,
        }
    }

    return undefined;
  }

  // метод сервера
  // принятие рещение о недостающих элементах на основании состоянии клиента
  // от клиента пришли времена последних обновлений каждого объекта
  // 1) вибираем из списка те что у меня (сервера) уже нет а а у клиента есть => список удаления
  // 2) добавляем новые
  // 3) добавляем измененные объекты (время сервера > времени клиента)
  getDataForSync(clientData: BSSyncState): string {
    if (!this.inited) return undefined;

    const strItems = [];

    logd(`bds(${this.id}) => getDataForSync(start)`, clientData.data.length, Object.keys(clientData.data).slice(0, 5).map(key => clientData.data[key]))

    if (this.syncType === 'full') {

      const srcIdList = Object.keys(this.$values);
      const destIdList = Object.keys(clientData.data);

      const deletedItems = destIdList.filter(x => !srcIdList.includes(x));
      deletedItems.forEach(key => {
        strItems.push(`${key}${splitter}undefined`);
      })

      Object.keys(this.$values)
        .some((key) => {
          if (!clientData.data[key]) // new object
            strItems.push(`${key}${splitter}${this.$values[key].str}`);
          else 
          if (this.$values[key].rt > new Date(clientData.data[key])) { // cahnged object
            strItems.push(`${key}${splitter}${this.$values[key].str}`);
          }

          if (strItems.length > 200) return true;
          return false;
        });

      logd(`bds(${this.id}) => getDataForSync(finish)`)

    } else {
      Object.keys(this.$values)
        .forEach((key) => {
          if (this.$values[key].rt > clientData.rt || !clientData.data[key]) {
            strItems.push(`${key}${splitter}${this.$values[key].str}`);
          }
        });  
    }

    // rt###key1###value1###key2###value2 ..........
    if (!strItems.length) return undefined;
    return `${(new Date()).toISOString()}${splitter}${strItems.join(splitter)}`;
  }

  public pack(rt: Date, data: {[key: string]: BSValue<DataType>}) {
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

    logd(`bds(${this.id}) => setSyncItems, len=`, strData.length, bulk);

    try {
      const items = strData.split(splitter).filter(el => !!el);
      const rt = new Date(items.shift());

      const data = {};
      for (let i=0; i < items.length; i += 2) {
        if (items[i+1] === 'false') {
          delete data[items[i]];
        } else {
          data[items[i]] = items[i+1] === 'undefined' ? null : {
            str: items[i+1],
            v: this.mode === 'proxy' ? undefined : JSON.parse(items[i+1]),
            rt,
          }
        }
      }

      if (bulk) this.syncTime = rt;

      const evData: DataEvent<DataType> = { data: {}, rt, bulk };
      Object.keys(data).forEach(key => {
        if (data[key] === null) {
          const $val = this.$values[key];

          if ($val) {
            delete this.$values[key];
            this.emit("delete", key, $val.v);
            if (this.cache) this.cache.delete(key);
          }
        } else {
          this.$values[key] = data[key];
          evData.data[key] = { rt, ...data[key] };
        }
      })
      
      // if (bulk) { // синхронизация куска данных - надо удалить все старое что не пришло - значит удалено
      //   for (const key in this.values) {
      //     console.log("........", key, this.values[key].rt, rt, this.values[key].rt < rt)
      //     if (this.values[key].rt < rt) {
      //       const $val = this.values[key];
      //       delete this.values[key];
      //       this.emit("delete", key, $val.v );
      //       if (this.cache) this.cache.delete(key);
      //     }
      //   }
      // }

      if (this.cache) {
        Object.keys(evData.data).forEach(key => {
          this.cache.set(key, evData.data[key].rt, evData.data[key].str, undefined);
        })
      }

      if (Object.keys(evData.data).length) this.emit("data", evData );
    } catch (ex) {
      this.emit('error', ex.message);
    }
  }
}
