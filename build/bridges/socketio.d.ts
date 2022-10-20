import BigKVSync from "../dataSync";
export default class SioBridge {
    private readonly nodeId;
    private readonly bds;
    constructor(nodeId: string, bds: BigKVSync);
    startServer(sio: any): BigKVSync;
    startClient(sio_client: any): () => void;
}
//# sourceMappingURL=socketio.d.ts.map