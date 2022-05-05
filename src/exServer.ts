import { startServer } from './ipcSync';

function start() {
    const syncList = startServer({ nodeId: 'measures '});
    syncList.set('test0', { hello:'world'});
    syncList.set('test1', { hello:'world'});
    syncList.set('test2', { hello:'world'});
    syncList.set('test3', { hello:'world'});
    syncList.set('test4', { hello:'world'});

    setInterval(() => {
        syncList.set('test4', { hello:'world'});
        syncList.set('test3', { hello:'world'});
        syncList.set('test2', { hello:'world1'});
        syncList.set('test2', { hello:'world3'});
        syncList.set('test5', { hello:'world3'});
        syncList.set('test6', { hello:'world3'});
        syncList.set('test7', { hello:'world3'});
    }, 5000);
}

start();
