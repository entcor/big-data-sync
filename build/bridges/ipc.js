"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_ipc_1 = __importDefault(require("node-ipc"));
class Bridge {
    constructor(nodeId, bds) {
        this.nodeId = nodeId;
        this.bds = bds;
        this.ipc = new node_ipc_1.default.IPC();
    }
    startServer() {
        this.ipc.config.logger = () => { };
        let client;
        this.ipc.config.id = this.nodeId;
        this.ipc.config.retry = 1500;
        this.ipc.serve(() => {
            this.ipc.server.on(`list:state`, (syncState, socket) => {
                client = socket;
                const syncData = this.bds.getDataForSync(syncState);
                this.ipc.server.emit(socket, `list:syncData`, syncData);
            });
            // this.ipc.server.on('connect', () => console.log('connect'));
            // this.ipc.server.on('disconnect', () => console.log('disconnect'));
            this.ipc.server.on('socket.disconnected', () => {
                client = undefined;
            });
        });
        this.ipc.server.start();
        this.bds.on('data', ($d) => {
            const sendData = this.bds.pack($d.rt, $d.data);
            if (client)
                this.ipc.server.emit(client, `list:rtdata`, sendData);
        });
        this.bds.on('delete', (id) => {
            const sendData = this.bds.pack(new Date(), { [id]: undefined });
            if (client)
                this.ipc.server.emit(client, `list:rtdata`, sendData);
        });
        return this.bds;
    }
    startClient() {
        this.ipc.config.logger = () => { };
        const sendSyncState = () => {
            const syncState = this.bds.getSyncState(); // читаем у клиента состояние для отправки на сервер
            this.ipc.of[this.nodeId].emit(`list:state`, syncState);
        };
        this.ipc.connectTo(this.nodeId, () => {
            this.ipc.of[this.nodeId].on('connect', () => {
                // console.log('connect client');
                sendSyncState();
            });
            this.ipc.of[this.nodeId].on('disconnect', () => {
                // debug('disconnect client');
            });
            this.ipc.of[this.nodeId].on('list:syncData', //срезовая синхронизация
            (syncData) => {
                this.bds.setSyncItems(syncData, true);
            });
            this.ipc.of[this.nodeId].on('list:rtdata', //real time data - при изменении параметра
            (rtData) => {
                this.bds.setSyncItems(rtData, false);
            });
        });
        return this.bds;
    }
}
exports.default = Bridge;
//# sourceMappingURL=ipc.js.map