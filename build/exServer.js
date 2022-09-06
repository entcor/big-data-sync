"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ipcSync_1 = require("./ipcSync");
function start() {
    const syncList = (0, ipcSync_1.startServer)({ nodeId: 'measures ' });
    syncList.set('test0', { hello: 'world' });
    syncList.set('test1', { hello: 'world' });
    syncList.set('test2', { hello: 'world' });
    syncList.set('test3', { hello: 'world' });
    syncList.set('test4', { hello: 'world' });
    setInterval(() => {
        syncList.set('test4', { hello: 'world4' });
        syncList.set('test3', { hello: 'world3' });
        syncList.set('test2', { hello: 'world2' });
        syncList.set('test2', { hello: 'world22' });
        syncList.set('test5', { hello: 'world555' });
        syncList.set('test6', { hello: 'world6666' });
        syncList.set('test7', { hello: 'world777777' });
    }, 5000);
    setInterval(() => {
        syncList.set('test4', undefined);
        syncList.set('test3', undefined);
        syncList.set('test2', undefined);
    }, 7000);
}
start();
//# sourceMappingURL=exServer.js.map