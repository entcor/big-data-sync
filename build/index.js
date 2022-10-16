"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SIOBridge = exports.IPCBridge = exports.BDS = void 0;
var dataSync_1 = require("./dataSync");
Object.defineProperty(exports, "BDS", { enumerable: true, get: function () { return __importDefault(dataSync_1).default; } });
var ipc_1 = require("./bridges/ipc");
Object.defineProperty(exports, "IPCBridge", { enumerable: true, get: function () { return __importDefault(ipc_1).default; } });
var socketio_1 = require("./bridges/socketio");
Object.defineProperty(exports, "SIOBridge", { enumerable: true, get: function () { return __importDefault(socketio_1).default; } });
//# sourceMappingURL=index.js.map