import { startCient } from './ipcSync';

function start() {
    const syncList = startCient({ nodeId: 'measures '});
    syncList.onData((data) => {
        console.log("change ", data);
    })

    syncList.onDelete((key, data) => {
        console.log("delete ", key, data);
    })
}

start();
