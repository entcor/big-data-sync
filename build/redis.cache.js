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
exports.RedisCache = void 0;
const etaglogger_1 = __importDefault(require("etaglogger"));
const util_1 = require("util");
const logd = (0, etaglogger_1.default)('BDS.CACHE');
const splitter = '@#$%$#@';
class RedisCache {
    constructor(nodeId, redisClient) {
        this.nodeId = nodeId;
        this.redisClient = redisClient;
    }
    set(id, rt, value, expire) {
        logd('bds cache => set', id);
        return this.redisClient.HSET(this.nodeId, id, `${rt.toString()}${splitter}${value}${splitter}${expire && expire.getTime()}`);
    }
    delete(id) {
        logd('bds cache => delete', id);
        return this.redisClient.HDEL(this.nodeId, id);
    }
    reset() {
        return this.redisClient.DEL(this.nodeId);
    }
    restore() {
        return __awaiter(this, void 0, void 0, function* () {
            logd('bds cache => cache restore');
            const HGETALL = (0, util_1.promisify)(this.redisClient.HGETALL).bind(this.redisClient);
            const data = (yield HGETALL(this.nodeId)) || {};
            const res = {};
            Object.keys(data)
                .forEach(key => {
                const rec = data[key];
                const [rtstr, str, expire] = rec.split(splitter);
                try {
                    res[key] = { rt: new Date(rtstr), str, expire: new Date(expire) };
                }
                catch (ex) { }
            });
            logd('bds cache => cache restored', Object.keys(res).length);
            return res;
        });
    }
}
exports.RedisCache = RedisCache;
//# sourceMappingURL=redis.cache.js.map