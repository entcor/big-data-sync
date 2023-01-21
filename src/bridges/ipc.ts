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
          logd('ipc => serve start', this.nodeId); 

          this.ipc.server.on(`list:state`,
              (syncState, socket) => {
                  client = socket;
                  const syncData = this.bds.getDataForSync(syncState);
                  if (syncData) this.ipc.server.emit(socket, `list:syncData`, syncData);
              }
          );
          this.ipc.server.on('connect', () => logd('ipc server => connected'));
          this.ipc.server.on('disconnect', () => logd('ipc server => disconnected'));
          this.ipc.server.on('socket.disconnected',
              () => {
                  logd('ipc => socket connected') 
                  client = undefined;
              }
          );
        }
      );
      
      this.ipc.server.start();
      this.bds.on('data', ($d: DataEvent<DataType>)=> {
        logd('IPC server => data');
        const sendData = this.bds.pack($d.rt, $d.data);
        if (client) this.ipc.server.emit(client, `list:rtdata`, sendData)}
      );

      this.bds.on('delete', (id: string)=> {
        logd('IPC server => delete', id);
        const sendData = this.bds.pack(new Date(), { [id]: undefined });
        if (client) this.ipc.server.emit(client, `list:rtdata`, sendData)}
      );

      return this.bds;
    }
    
    startClient() {
      this.ipc.config.logger = () => {}

      logd('IPC client => connecting', this.nodeId);

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
                      logd('IPC client => connected');
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
                    logd('IPC client => setSyncItems');
                    this.bds.setSyncItems(syncData, true);
                  }
              );
              this.ipc.of[this.nodeId].on(
                  'list:rtdata',  //real time data - при изменении параметра
                  (rtData) => {
                    logd('IPC client => setSyncItems', rtData);
                    this.bds.setSyncItems(rtData, false);
                  }
              );
          }
      );

        setInterval(sendSyncState, 60 * 1000);

      return this.bds;
    }
}