import BigKVSync from '../dataSync';
export default class Bridge<DataType> {
    private readonly nodeId;
    private readonly bds;
    private ipc;
    constructor(nodeId: string, bds: BigKVSync<DataType>);
    startServer(): BigKVSync<DataType>;
    startClient(): BigKVSync<DataType>;
}
//# sourceMappingURL=ipc.d.ts.map