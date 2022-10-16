"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisCache = void 0;
const etaglogger_1 = __importDefault(require("etaglogger"));
const logd = (0, etaglogger_1.default)('BDS.CACHE');
const splitter = '@#$%$#@';
class RedisCache {
    constructor(nodeId, redisClient) {
        this.nodeId = nodeId;
        this.redisClient = redisClient;
    }
    set(id, rt, value) {
        return this.redisClient.HSET(this.nodeId, id, `${rt.toString()}${splitter}${value}`);
    }
    delete(id) {
        return this.redisClient.HDEL(this.nodeId, id);
    }
    async restore() {
        logd('bds cache => cache restore');
        const data = await this.redisClient.HGETALL(this.nodeId) || {};
        const res = {};
        Object.keys(data)
            .forEach(key => {
            const rec = data[key];
            const [rtstr, str] = rec.split(splitter);
            try {
                res[key] = { rt: new Date(rtstr), str };
            }
            catch (ex) { }
        });
        logd('bds cache => cache restored', Object.keys(res).length);
        return res;
    }
}
exports.RedisCache = RedisCache;
//# sourceMappingURL=redis.cache.js.map