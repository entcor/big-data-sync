import BDS from '../dataSync'; 
import bdsIpcBridge from '../bridges/ipc'; 
import { RedisCache } from '../redis.cache';
import { createClient } from 'redis';
const redisClient = createClient({ db: 3 });

async function start() {
    const redisCache = new RedisCache('proxy.measures.server', redisClient);
    const bds = new BDS('proxy.measures.server', 'server', redisCache, undefined, 0, 60 * 60);
    await bds.init();
    
    new bdsIpcBridge('measures', bds).startServer();

    // bds.set('test0', { hello:'world', world: 'www'});
    // bds.set('test1', { hello:'world 1'});
    // bds.set('test2', { hello:'world'});
    // bds.set('test3', { hello:'world'});
    // bds.set('test4', { hello:'world'});

    setInterval(() => {
        bds.set('test1', { hello:'world 2'});
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
}

start();
