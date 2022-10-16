"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SioBridge {
    constructor(nodeId, bds) {
        this.nodeId = nodeId;
        this.bds = bds;
    }
    startServer(sio) {
        sio.on('connection', (socket) => {
            let client = socket;
            socket.on('disconnect', () => {
                client = undefined;
            });
            this.bds.on('data', ($d) => {
                if (client)
                    client.emit(`${this.nodeId}:list:rtdata`, this.bds.pack($d.rt, $d.data));
            });
            this.bds.on('delete', (id) => {
                if (client)
                    client.emit(`${this.nodeId}:list:rtdata`, this.bds.pack(new Date(), { [id]: undefined }));
            });
            socket.on(`${this.nodeId}:list:state`, (syncState) => {
                const syncData = this.bds.getDataForSync(syncState);
                socket.emit(`${this.nodeId}:list:syncData`, syncData);
            });
        });
        return this.bds;
    }
    startClient(sio_client) {
        const sendSyncState = () => {
            const syncState = this.bds.getSyncState(); // читаем у клиента состояние для отправки на сервер
            sio_client.emit(`${this.nodeId}:list:state`, syncState);
        };
        sio_client.on('connect', () => {
            sendSyncState();
        });
        sio_client.on(`${this.nodeId}:list:syncData`, (syncData) => {
            this.bds.setSyncItems(syncData, true);
        });
        sio_client.on(`${this.nodeId}:list:rtdata`, //real time data - при изменении параметра
        (rtData) => {
            this.bds.setSyncItems(rtData, false);
        });
        return this.bds;
    }
}
exports.default = SioBridge;
//# sourceMappingURL=socketio.js.map