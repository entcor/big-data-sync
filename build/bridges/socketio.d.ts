import BigKVSync from "../dataSync";
export default class SioBridge<DataType> {
    private readonly nodeId;
    private readonly bds;
    constructor(nodeId: string, bds: BigKVSync<DataType>);
    startServer(sio: any): BigKVSync<DataType>;
    startClient(sio_client: any): () => void;
}
//# sourceMappingURL=socketio.d.ts.map