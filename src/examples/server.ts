import BDS from '../dataSync'; 
import bdsIpcBridge from '../bridges/ipc'; 

function start() {
    const bds = new BDS(false);
    new bdsIpcBridge('measures', bds).startServer();

    bds.set('test0', { hello:'world'});
    bds.set('test1', { hello:'world'});
    bds.set('test2', { hello:'world'});
    bds.set('test3', { hello:'world'});
    bds.set('test4', { hello:'world'});

    // setInterval(() => {
    //     console.log('create')
    //     bds.set('test4', { hello: new Date()});
    //     // bds.set('test3', { hello:'world3'});
    //     // bds.set('test2', { hello:'world2'});
    //     // bds.set('test2', { hello:'world22'});
    //     // bds.set('test5', { hello:'world555'});
    //     // bds.set('test6', { hello:'world6666'});
    //     // bds.set('test7', { hello:'world777777'});
    // }, 5000);

    // setInterval(() => {
    //     console.log('delete')
    //     bds.set('test4', undefined);
    //     bds.set('test3', undefined);
    //     bds.set('test2', undefined);
    // }, 3000);
}

start();
