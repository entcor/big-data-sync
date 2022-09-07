import { startCient } from './ipcSync';

function start() {
    const syncList = startCient({ nodeId: 'measures '});
    syncList.onData((data, _rt, bulk) => {
        console.log("change ", bulk, data);
    })

    syncList.onDelete((key, data) => {
        console.log("delete ", key, data);
    })
}

start();
