"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisCache = void 0;
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
        return res;
    }
}
exports.RedisCache = RedisCache;
//# sourceMappingURL=redis.cache.js.map