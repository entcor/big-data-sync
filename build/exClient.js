"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ipcSync_1 = require("./ipcSync");
function start() {
    const syncList = (0, ipcSync_1.startCient)({ nodeId: 'measures ' });
    syncList.onData((data) => {
        console.log("change ", data);
    });
    syncList.onDelete((key, data) => {
        console.log("delete ", key, data);
    });
}
start();
//# sourceMappingURL=exClient.js.map