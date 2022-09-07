"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCient = exports.startServer = void 0;
const node_ipc_1 = __importDefault(require("node-ipc"));
const dataSync_1 = require("./dataSync");
function startServer({ nodeId }) {
    const ipc = new node_ipc_1.default.IPC();
    ipc.config.logger = () => { };
    const srvList = new dataSync_1.BigKVSync(false);
    let client;
    ipc.config.id = nodeId;
    ipc.config.retry = 1500;
    ipc.serve(function () {
        ipc.server.on('list:state', function (syncState, socket) {
            client = socket;
            const syncData = srvList.getDataForSync(syncState);
            // ipc.log('got a message : ', syncState, 'send:', syncData);
            ipc.server.emit(socket, 'list:syncData', syncData);
        });
        ipc.server.on('connect', () => console.log('connect'));
        ipc.server.on('disconnect', () => console.log('disconnect'));
        ipc.server.on('socket.disconnected', function () {
            client = undefined;
            // ipc.log('client ' + destroyedSocketID + ' has disconnected!');
        });
    });
    ipc.server.start();
    srvList.onData((data, rt) => { if (client)
        ipc.server.emit(client, 'list:rtdata', JSON.stringify({ data, rt })); });
    return srvList;
}
exports.startServer = startServer;
function startCient({ nodeId }) {
    const ipc = new node_ipc_1.default.IPC();
    ipc.config.logger = () => { };
    const clientList = new dataSync_1.BigKVSync(false);
    function sendSyncState() {
        const syncState = clientList.getSyncState(); // читаем у клиента состояние для отправки на сервер
        ipc.of[nodeId].emit('list:state', syncState);
    }
    ipc.connectTo(nodeId, function () {
        ipc.of[nodeId].on('connect', function () {
            console.log('connect client');
            sendSyncState();
        });
        ipc.of[nodeId].on('disconnect', function () {
            // console.log('disconnect client');
            // ipc.log('disconnected');
        });
        ipc.of[nodeId].on('list:syncData', //срезовая синхронизация
        function (syncData) {
            // ipc.log('1111111 got a message from');
            clientList.setSyncItems(syncData, true);
        });
        ipc.of[nodeId].on('list:rtdata', //real time data - при изменении параметра
        function (rtData) {
            // ipc.log('222222222 got a message from', rtData);
            clientList.setSyncItems(rtData, false);
        });
    });
    return clientList;
}
exports.startCient = startCient;
//# sourceMappingURL=ipcSync.js.map