import BigKVSync from '../dataSync';
export default class Bridge {
    private readonly nodeId;
    private readonly bds;
    private ipc;
    constructor(nodeId: string, bds: BigKVSync);
    startServer(): BigKVSync;
    startClient(): BigKVSync;
}
//# sourceMappingURL=ipc.d.ts.map