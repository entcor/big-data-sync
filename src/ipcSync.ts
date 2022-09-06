import IPC from 'node-ipc';
import { BigKVSync } from './dataSync';

export function startServer({ nodeId }: {nodeId: string}): BigKVSync  {
    const ipc = new IPC.IPC();
    ipc.config.logger = () => {}

    const srvList = new BigKVSync(false);
    let client;

    ipc.config.id = nodeId;
    ipc.config.retry= 1500;
    
    ipc.serve(
        function(){
            ipc.server.on('list:state',
                function(syncState, socket){
                    client = socket;
                    const syncData = srvList.getDataForSync(syncState);
                    // ipc.log('got a message : ', syncState, 'send:', syncData);
                    ipc.server.emit(socket, 'list:syncData', syncData);
                }
            );
            ipc.server.on('connect', () => console.log('connect'));
            ipc.server.on('disconnect', () => console.log('disconnect'));
            ipc.server.on(
                'socket.disconnected',
                function() {
                    client = undefined;
                    // ipc.log('client ' + destroyedSocketID + ' has disconnected!');
                }
            );
        }
    );
    
    ipc.server.start();
    srvList.onData((data, rt)=> { if (client) ipc.server.emit(client, 'list:rtdata', JSON.stringify({ data, rt }) )});

    return srvList;
}

export function startCient({ nodeId }: {nodeId: string}) {
    const ipc = new IPC.IPC();
    ipc.config.logger = () => {}

    const clientList = new BigKVSync(false);

    function sendSyncState() {
        const syncState = clientList.getSyncState(); // читаем у клиента состояние для отправки на сервер
        ipc.of[nodeId].emit('list:state', syncState);
    }

    ipc.connectTo(
        nodeId,
        function(){
            ipc.of[nodeId].on(
                'connect',
                function(){
                    console.log('connect client');
                    sendSyncState();
                }
            );
            ipc.of[nodeId].on(
                'disconnect',
                function(){
                    console.log('disconnect client');
                    // ipc.log('disconnected');
                }
            );
            ipc.of[nodeId].on(
                'list:syncData',  //срезовая синхронизация
                function(syncData) {
                    // ipc.log('1111111 got a message from');
                    clientList.setSyncItems(syncData, true);
                }
            );
            ipc.of[nodeId].on(
                'list:rtdata',  //real time data - при изменении параметра
                function(rtData) {
                    // ipc.log('222222222 got a message from', rtData);
                    clientList.setSyncItems(rtData, false);
                }
            );
        }
    );

    return clientList;
}
