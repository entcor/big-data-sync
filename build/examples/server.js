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
const dataSync_1 = __importDefault(require("../dataSync"));
const ipc_1 = __importDefault(require("../bridges/ipc"));
const redis_cache_1 = require("../redis.cache");
const redis_1 = require("redis");
const redisClient = (0, redis_1.createClient)({ db: 3 });
function start() {
    return __awaiter(this, void 0, void 0, function* () {
        const redisCache = new redis_cache_1.RedisCache('proxy.measures.server', redisClient);
        const bds = new dataSync_1.default('proxy.measures.server', 'server', redisCache, undefined, 0, 60 * 60);
        yield bds.init();
        new ipc_1.default('measures', bds).startServer();
        // bds.set('test0', { hello:'world', world: 'www'});
        // bds.set('test1', { hello:'world 1'});
        // bds.set('test2', { hello:'world'});
        // bds.set('test3', { hello:'world'});
        // bds.set('test4', { hello:'world'});
        setInterval(() => {
            bds.set('test1', { hello: 'world 2' });
            // bds.set('test3', { hello:'world'});
            // bds.set('test4', { hello: new Date()});
        }, 5000);
        // setInterval(() => {
        //     console.log('create world !!!')
        //     bds.set('test4', { world: new Date()});
        // }, 10000);
        //     setInterval(() => {
        //         console.log('delete')
        //         bds.set('test4', undefined);
        //         bds.set('test3', undefined);
        //         bds.set('test2', undefined);
        //     }, 3000);
    });
}
start();
//# sourceMappingURL=server.js.map