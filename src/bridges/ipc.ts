import IPC from 'node-ipc';
import BigKVSync, { DataEvent } from '../dataSync';
import TagLogger from 'etaglogger';
const logd = TagLogger('BDS.IPC');

export default class Bridge<DataType> {
    private ipc: IPC.IPC;

    constructor(
      private readonly nodeId: string,
      private readonly bds: BigKVSync<DataType>,
    ) {
      this.ipc = new IPC.IPC();
    }

    startServer() {
      this.ipc.config.logger = () => {}
      let client;

      this.ipc.config.id = this.nodeId;
      this.ipc.config.retry= 1500;
      
      this.ipc.serve(
        () => {
          logd(`ipc server (${this.bds.id}) => server start`, this.nodeId, [this.bds.id]);

          this.ipc.server.on(`list:state`,
              (syncState, socket) => {
                  client = socket;
                  const syncData = this.bds.getDataForSync(syncState);
                  if (syncData) this.ipc.server.emit(socket, `list:syncData`, syncData);
              }
          );
          this.ipc.server.on('connect', () => logd(`ipc server (${this.bds.id})  => connected`, [this.bds.id]));
          this.ipc.server.on('disconnect', () => logd(`ipc server (${this.bds.id}) => disconnected`, [this.bds.id]));
          this.ipc.server.on('socket.disconnected',
              () => {
                  logd(`ipc server (${this.bds.id}) => socket connected`, [this.bds.id]) 
                  client = undefined;
              }
          );
        }
      );
      
      this.ipc.server.start();
      this.bds.on('data', ($d: DataEvent<DataType>)=> {
        logd(`IPC server (${this.bds.id}) => data`, [this.bds.id]);
        const sendData = this.bds.pack($d.rt, $d.data);
        if (client) this.ipc.server.emit(client, `list:rtdata`, sendData)}
      );

      this.bds.on('delete', (id: string)=> {
        logd(`IPC server (${this.bds.id}) => delete`, id, [this.bds.id]);
        const sendData = this.bds.pack(new Date(), { [id]: undefined });
        if (client) this.ipc.server.emit(client, `list:rtdata`, sendData)}
      );

      return this.bds;
    }
    
    startClient() {
      this.ipc.config.logger = () => {}

      logd(`IPC client (${this.bds.id}) => connecting`, this.nodeId);

      const sendSyncState = () => {
          const syncState = this.bds.getSyncState(); // читаем у клиента состояние для отправки на сервер (время, время каждого параметр)
          this.ipc.of[this.nodeId].emit(`list:state`, syncState);
      }

      this.ipc.connectTo(
          this.nodeId,
          () => {
              this.ipc.of[this.nodeId].on(
                  'connect',
                  () => {
                      logd(`IPC client (${this.bds.id}) => connected`);
                      sendSyncState();
                  }
              );
              this.ipc.of[this.nodeId].on(
                  'disconnect',
                  () => {
                    // logd('IPC client => disconnected');
                  }
              );
              this.ipc.of[this.nodeId].on(
                  'list:syncData',  //срезовая синхронизация
                  (syncData) => {
                    logd(`IPC client (${this.bds.id}) => setSyncItems`, [this.bds.id]);
                    this.bds.setSyncItems(syncData, true);
                  }
              );
              this.ipc.of[this.nodeId].on(
                  'list:rtdata',  //real time data - при изменении параметра
                  (rtData) => {
                    logd(`IPC client (${this.bds.id}) => setSyncItems`, rtData, [this.bds.id]);
                    this.bds.setSyncItems(rtData, false);
                  }
              );
          }
      );

        setInterval(sendSyncState, 60 * 1000);

      return this.bds;
    }
}