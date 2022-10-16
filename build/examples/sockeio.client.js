"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_client_1 = require("socket.io-client");
const dataSync_1 = __importDefault(require("../dataSync"));
const socketio_1 = __importDefault(require("../bridges/socketio"));
function init() {
    const sio_client = (0, socket_io_client_1.io)("ws://127.0.0.1:3000", {});
    const bds = new dataSync_1.default(false);
    bds.on('data', () => console.log('create', bds.debug()));
    bds.on('delete', () => console.log('delete', bds.debug()));
    new socketio_1.default('measures', bds).startClient(sio_client);
}
init();
//# sourceMappingURL=sockeio.client.js.map