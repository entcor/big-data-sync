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
        syncList.set('test4', { hello: 'world' });
        syncList.set('test3', { hello: 'world' });
        syncList.set('test2', { hello: 'world1' });
        syncList.set('test2', { hello: 'world3' });
        syncList.set('test5', { hello: 'world3' });
        syncList.set('test6', { hello: 'world3' });
        syncList.set('test7', { hello: 'world3' });
    }, 5000);
}
start();
//# sourceMappingURL=exServer.js.map