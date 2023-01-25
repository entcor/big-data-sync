"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const etaglogger_1 = __importDefault(require("etaglogger"));
const splitter = '#@%@#';
const logd = (0, etaglogger_1.default)('BDS');
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
function pickAndSort(obj = {}, fields) {
    const filtered = !!(fields === null || fields === void 0 ? void 0 : fields.length);
    if (!obj)
        return { obj: undefined, strObj: undefined, filtered };
    const $fields = (filtered ? fields : Object.keys(obj)).sort();
    const res = {};
    $fields.forEach(key => res[key] = obj[key]);
    return { obj: res, strObj: JSON.stringify(res), filtered };
}
;
class BDS extends events_1.EventEmitter {
    constructor(id, mode, cache, fields = [], ttlCheckInterval = 0, ttl = undefined) {
        super();
        this.id = id;
        this.mode = mode;
        this.cache = cache;
        this.fields = fields;
        this.ttlCheckInterval = ttlCheckInterval;
        this.ttl = ttl;
        this.$values = {};
        this.syncType = 'full';
        this.inited = false;
        this.syncTime = new Date(0);
        this.$values = {};
        if (this.ttlCheckInterval) {
            setInterval(() => this.checkTTL(), ttlCheckInterval * 1000);
        }
    }
    get filtered() {
        var _a;
        return ((_a = this.fields) === null || _a === void 0 ? void 0 : _a.length) > 0;
    }
    get $cache() {
        return this.cache;
    }
    checkTTL() {
        const now = new Date();
        Object.keys(this.$values).forEach((key) => {
            const $data = this.$values[key];
            if ($data.expire && $data.expire > now) {
                delete this.$values[key];
                if (this.cache)
                    this.cache.delete(key);
            }
        });
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.inited = false;
            if (this.cache) {
                const data = yield this.cache.restore();
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
                });
            }
            logd(`bds(${this.id}) => inited !!!!`, [this.id]);
            this.inited = true;
        });
    }
    keys() {
        return Object.keys(this.$values);
    }
    data() {
        return Object.keys(this.$values).reduce((agg, key) => {
            agg[key] = this.$values[key].v;
            return agg;
        }, {});
    }
    array() {
        return Object.values(this.$values).map(el => el.v);
    }
    values() {
        return Object.keys(this.$values).reduce((acc, key) => { acc[key] = this.$values[key].v; return acc; }, {});
    }
    getExpireTime(ttl, date) {
        const $ttl = ttl || this.ttl;
        return $ttl ? new Date((date || new Date()).getTime() + $ttl * 1000) : undefined;
    }
    ;
    set(k, v, ttl) {
        if (!v)
            v = undefined;
        const compareObj = pickAndSort(v, this.fields);
        const now = new Date();
        logd(`bds(${this.id}) => set`, k, [this.id]);
        logd(`bds(${this.id}) => set(test)`, this.$values[k] && compareObj.strObj === (this.$values[k].filteredStr || this.$values[k].str), compareObj.strObj, this.$values[k] && (this.$values[k].filteredStr || this.$values[k].str), [this.id]);
        if ((!this.$values[k] && !compareObj.strObj) || (this.$values[k] && compareObj.strObj === (this.$values[k].filteredStr || this.$values[k].str))) {
            // тут странно - не знаю как правильно но если фильтрующие поля не поменялись -> значение объекта все равно меняем (но толлько локально)
            if (!this.$values[k] && v)
                this.$values[k] = { rt: now, v, str: undefined, filteredStr: undefined, expire: this.getExpireTime(ttl) };
            else {
                this.$values[k].v = v;
                this.$values[k].rt = now;
            }
            return; // object is not changed
        }
        const str = compareObj.filtered ? JSON.stringify(v) : compareObj.strObj;
        const filteredStr = this.filtered ? compareObj.strObj : undefined;
        const expire = this.getExpireTime(ttl);
        this.$values[k] = {
            rt: now, v, str,
            filteredStr,
            expire,
        };
        if (!v) {
            this.emit("delete", k, this.$values[k]);
            delete this.$values[k];
            if (this.cache)
                this.cache.delete(k);
            return;
        }
        if (this.cache)
            this.cache.set(k, now, str, filteredStr, expire);
        this.emit("data", {
            data: { [k]: { str, v } || null },
            rt: now,
            bulk: false,
        });
    }
    setBulk(data, ttl) {
        Object.keys(data).forEach(key => this.set(key, data[key], ttl));
    }
    get(id) {
        var _a;
        return (_a = this.$values[id]) === null || _a === void 0 ? void 0 : _a.v;
    }
    debug() {
        return this.$values;
    }
    // метод клиента
    // получаем время последней синхронизации и то, что было синхронизировано после последней полной синхронизации
    // server=>client (getSyncState) => client=>server(response), server => send changes 
    getSyncState() {
        if (!this.inited)
            return undefined;
        logd(`bds(${this.id}) => getSyncState(start)`, [this.id]);
        // полная синхронизация: {rt: sync Time, data: { key: rt, key2: rt }}
        // т.е. получаем полный список всех элементов хранилищя с их временем изменения
        if (this.syncType === 'full') {
            const syncRtList = Object.keys(this.$values)
                .reduce((prev, key) => {
                prev[key] = this.$values[key].rt;
                return prev;
            }, {});
            logd(`bds(${this.id}) => getSyncState(finish)`, () => `count=${Object.keys(syncRtList).length}`, () => Object.keys(syncRtList).slice(0, 5).reduce((agg, key) => { agg[key] = syncRtList[key]; return agg; }, {}), [this.id]);
            return {
                rt: this.syncTime,
                data: syncRtList,
            };
        }
        return undefined;
    }
    // метод сервера
    // принятие рещение о недостающих элементах на основании состоянии клиента
    // от клиента пришли времена последних обновлений каждого объекта
    // 1) вибираем из списка те что у меня (сервера) уже нет а а у клиента есть => список удаления
    // 2) добавляем новые
    // 3) добавляем измененные объекты (время сервера > времени клиента)
    getDataForSync(clientData) {
        if (!this.inited)
            return undefined;
        const strItems = [];
        logd(`bds(${this.id}) => getDataForSync(start)`, () => Object.keys(clientData.data).length, () => Object.keys(clientData.data).slice(0, 5).map(key => clientData.data[key]), [this.id]);
        if (this.syncType === 'full') {
            const srcIdList = Object.keys(this.$values);
            const destIdList = Object.keys(clientData.data);
            const deletedItems = destIdList.filter(x => !srcIdList.includes(x));
            deletedItems.forEach(key => {
                strItems.push(`${key}${splitter}undefined`);
            });
            Object.keys(this.$values)
                .some((key) => {
                if (!clientData.data[key]) // new object
                    logd(`bds(${this.id}) => compare->add`, key),
                        strItems.push(`${key}${splitter}${this.$values[key].str}`);
                else if (this.$values[key].rt > new Date(clientData.data[key])) { // cahnged object
                    logd(`bds(${this.id}) => compare->upd`, key, this.$values[key].rt, new Date(clientData.data[key])),
                        strItems.push(`${key}${splitter}${this.$values[key].str}`);
                }
                if (strItems.length > 200)
                    return true;
                return false;
            });
            logd(`bds(${this.id}) => getDataForSync(finish)`, () => `count=${strItems.length}`, [this.id]);
        }
        else {
            Object.keys(this.$values)
                .forEach((key) => {
                if (this.$values[key].rt > clientData.rt || !clientData.data[key]) {
                    strItems.push(`${key}${splitter}${this.$values[key].str}`);
                }
            });
        }
        // rt###key1###value1###key2###value2 ..........
        if (!strItems.length)
            return undefined;
        return `${(new Date()).toISOString()}${splitter}${strItems.join(splitter)}`;
    }
    pack(rt, data) {
        const strItems = [];
        Object.keys(data || {}).forEach(key => {
            var _a;
            const $str = (_a = data[key]) === null || _a === void 0 ? void 0 : _a.str;
            strItems.push(`${key}${splitter}${$str}`);
        });
        return `${(rt).toISOString()}${splitter}${strItems.join(splitter)}`;
    }
    // метод клиента
    // межсерверная синхронизация (bulk - срезовая)
    setSyncItems(strData, bulk) {
        if (!this.inited)
            return undefined;
        logd(`bds(${this.id}) => setSyncItems, len=`, strData.length, bulk, [this.id]);
        try {
            const items = strData.split(splitter).filter(el => !!el);
            const rt = new Date(items.shift());
            const data = {};
            for (let i = 0; i < items.length; i += 2) {
                if (items[i + 1] === 'false') {
                    delete data[items[i]];
                }
                else {
                    data[items[i]] = items[i + 1] === 'undefined' ? null : {
                        str: items[i + 1],
                        v: this.mode === 'proxy' ? undefined : JSON.parse(items[i + 1]),
                        rt,
                    };
                }
            }
            if (bulk)
                this.syncTime = rt;
            const evData = { data: {}, rt, bulk };
            Object.keys(data).forEach(key => {
                if (data[key] === null) {
                    const $val = this.$values[key];
                    if ($val) {
                        delete this.$values[key];
                        this.emit("delete", key, $val.v);
                        if (this.cache)
                            this.cache.delete(key);
                    }
                }
                else {
                    this.$values[key] = data[key];
                    evData.data[key] = Object.assign({ rt }, data[key]);
                }
            });
            // if (bulk) { // синхронизация куска данных - надо удалить все старое что не пришло - значит удалено
            //   for (const key in this.values) {
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
                    this.cache.set(key, evData.data[key].rt, evData.data[key].str, undefined, this.getExpireTime(this.ttl, evData.data[key].rt));
                });
            }
            if (Object.keys(evData.data).length)
                this.emit("data", evData);
        }
        catch (ex) {
            this.emit('error', ex.message);
        }
    }
}
exports.default = BDS;
//# sourceMappingURL=dataSync.js.map