import BigKVSync, { DataEvent } from "../dataSync";
import TagLogger from 'etaglogger';
const logd = TagLogger('BDS.SOCKETIO');

export default class SioBridge<DataType> {
  constructor(
      private readonly nodeId: string,
      private readonly bds: BigKVSync<DataType>,
    ) {}
  
  startServer(sio) {
    sio.on('connection', (socket) => {
      logd(`ipc server (${this.bds.id}) => client connected`, this.nodeId, [this.bds.id]); 

      let client = socket;

      socket.on('disconnect', () => {
        logd(`ipc server (${this.bds.id}) => dconnect`, this.nodeId, [this.bds.id]); 
        client = undefined;
      });

      this.bds.on('data', ($d: DataEvent<DataType>)=> {
        if (client) client.emit(`${this.nodeId}:list:rtdata`, this.bds.pack($d.rt, $d.data) )}
      );

      this.bds.on('delete', (id: string)=> {
        if (client) client.emit(`${this.nodeId}:list:rtdata`, this.bds.pack(new Date(), { [id]: undefined }) )}
      );

      socket.on(`${this.nodeId}:list:state`,
        (syncState) => {
          const syncData = this.bds.getDataForSync(syncState);
          if (syncData) socket.emit(`${this.nodeId}:list:syncData`, syncData);
        }
      );
    });

    return this.bds;
  }

  startClient(sio_client) {
    const sendSyncState = () =>  {
      const syncState = this.bds.getSyncState(); // читаем у клиента состояние для отправки на сервер
      if (sio_client.connected) sio_client.emit(`${this.nodeId}:list:state`, syncState);
    }

    if (sio_client.connected) {
      sendSyncState();
    }
  
    sio_client.on('connect', () => {
      sendSyncState();
    })

    sio_client.on(`${this.nodeId}:list:syncData`, (syncData) => {
      this.bds.setSyncItems(syncData, true);
    })

    sio_client.on(`${this.nodeId}:list:rtdata`,  //real time data - при изменении параметра
    (rtData) => { 
        this.bds.setSyncItems(rtData, false);
      }
    );

    setTimeout(() => sendSyncState());
    setInterval(() => sendSyncState(), 60 * 1000);

    return sendSyncState;
  }
}
