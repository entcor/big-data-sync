import BDS from '../dataSync'; 
import bdsIpcBridge from '../bridges/ipc'; 
import bdsSioBridge from '../bridges/socketio'; 

const express = require('express');
import { Server } from 'socket.io';
import { RedisCache } from '../redis.cache';
import { createClient } from 'redis';

const app = express();
const http = require('http');
const server = http.createServer(app);
const io = new Server(server);
const redisClient = createClient({ database: 3 });

async function init() {
    await redisClient.connect();
    server.listen(3000, () => {
      console.log('listening on *:3000');
    });

    // прокси режим означает что данные удут просто проходит через узел без их десериализации (т.е. на узле использоваться не будут)
    const redisCache = new RedisCache('proxy.measures', redisClient);
    console.log('connected')

    const bds = new BDS(true, redisCache);
    await bds.init();

    bds.on('data', () => console.log('create', bds.debug()))
    bds.on('delete', () => console.log('delete', bds.debug()))

    new bdsIpcBridge('measures', bds).startClient();
    new bdsSioBridge('measures', bds).startServer(io);
}

init();
