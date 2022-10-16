"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dataSync_1 = __importDefault(require("../dataSync"));
const ipc_1 = __importDefault(require("../bridges/ipc"));
const socketio_1 = __importDefault(require("../bridges/socketio"));
const express = require('express');
const socket_io_1 = require("socket.io");
const redis_cache_1 = require("../redis.cache");
const redis_1 = require("redis");
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = new socket_io_1.Server(server);
const redisClient = (0, redis_1.createClient)({ db: 3 });
async function init() {
    server.listen(3000, () => {
        console.log('listening on *:3000');
    });
    // прокси режим означает что данные удут просто проходит через узел без их десериализации (т.е. на узле использоваться не будут)
    const redisCache = new redis_cache_1.RedisCache('proxy.measures', redisClient);
    console.log('connected');
    const bds = new dataSync_1.default(true, redisCache);
    await bds.init();
    bds.on('data', () => console.log('create', bds.debug()));
    bds.on('delete', () => console.log('delete', bds.debug()));
    new ipc_1.default('measures', bds).startClient();
    new socketio_1.default('measures', bds).startServer(io);
}
init();
//# sourceMappingURL=proxy.js.map