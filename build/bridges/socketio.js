"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const etaglogger_1 = __importDefault(require("etaglogger"));
const logd = (0, etaglogger_1.default)('BDS.SOCKETIO');
class SioBridge {
    constructor(nodeId, bds) {
        this.nodeId = nodeId;
        this.bds = bds;
    }
    startServer(sio) {
        sio.on('connection', (socket) => {
            const bdsEvent_onData = ($d) => {
                if (client)
                    client.emit(`${this.nodeId}:list:rtdata`, this.bds.pack($d.rt, $d.data));
            };
            const bdsEvent_onDelete = (id) => {
                if (client)
                    client.emit(`${this.nodeId}:list:rtdata`, this.bds.pack(new Date(), { [id]: undefined }));
            };
            logd(`ipc server (${this.bds.id}) => client connected`, this.nodeId, [this.bds.id]);
            let client = socket;
            socket.on('disconnect', () => {
                logd(`ipc server (${this.bds.id}) => dconnect`, this.nodeId, [this.bds.id]);
                this.bds.off('data', bdsEvent_onData);
                this.bds.off('delete', bdsEvent_onDelete);
                client = undefined;
            });
            this.bds.on('data', bdsEvent_onData);
            this.bds.on('delete', bdsEvent_onDelete);
            socket.on(`${this.nodeId}:list:state`, (syncState) => {
                const syncData = this.bds.getDataForSync(syncState);
                if (syncData)
                    socket.emit(`${this.nodeId}:list:syncData`, syncData);
            });
        });
        return this.bds;
    }
    startClient(sio_client) {
        const sendSyncState = () => {
            const syncState = this.bds.getSyncState(); // читаем у клиента состояние для отправки на сервер
            if (sio_client.connected)
                sio_client.emit(`${this.nodeId}:list:state`, syncState);
        };
        if (sio_client.connected) {
            sendSyncState();
        }
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
        setTimeout(() => sendSyncState());
        setInterval(() => sendSyncState(), 60 * 1000);
        return sendSyncState;
    }
}
exports.default = SioBridge;
//# sourceMappingURL=socketio.js.map