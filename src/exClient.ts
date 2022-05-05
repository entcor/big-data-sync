import { startCient } from './ipcSync';

function start() {
    const syncList = startCient({ nodeId: 'measures '});
    syncList.onData((data) => {
        console.log("!!!!", data);
    })
}

start();
