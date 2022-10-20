import BigKVSync, { DataEvent } from "../dataSync";

export default class SioBridge {
  constructor(
      private readonly nodeId: string,
      private readonly bds: BigKVSync,
    ) {}
  
  startServer(sio) {
    sio.on('connection', (socket) => {
      console.log('client')
      let client = socket;

      socket.on('disconnect', () => {
        client = undefined;
      });

      this.bds.on('data', ($d: DataEvent)=> {
        if (client) client.emit(`${this.nodeId}:list:rtdata`, this.bds.pack($d.rt, $d.data) )}
      );

      this.bds.on('delete', (id: string)=> {
        if (client) client.emit(`${this.nodeId}:list:rtdata`, this.bds.pack(new Date(), { [id]: undefined }) )}
      );

      socket.on(`${this.nodeId}:list:state`,
        (syncState) => {
          console.log('data', syncState)

          const syncData = this.bds.getDataForSync(syncState);
          socket.emit(`${this.nodeId}:list:syncData`, syncData);
        }
      );
    });

    return this.bds;
  }

  startClient(sio_client) {

    const sendSyncState = () =>  {
      const syncState = this.bds.getSyncState(); // читаем у клиента состояние для отправки на сервер
      console.log('12312312312');
      sio_client.emit(`${this.nodeId}:list:state`, syncState);
    }

    if (sio_client.connected) {
      sendSyncState();
    }
  
    sio_client.on('connect', () => {
      sendSyncState();
    })

    sio_client.on(`${this.nodeId}:list:syncData`, (syncData) => {
      console.log('12312312312', `${this.nodeId}:list:syncData`);
      this.bds.setSyncItems(syncData, true);
    })

    sio_client.on(`${this.nodeId}:list:rtdata`,  //real time data - при изменении параметра
    (rtData) => { 
      console.log('12312312312', `${this.nodeId}:list:rtdata`);
        this.bds.setSyncItems(rtData, false);
      }
    );

    return sendSyncState;
  }
}
