import { io } from "socket.io-client";
import BDS from '../dataSync'; 
import bdsSioBridge from '../bridges/socketio';

function init() {
    const sio_client = io("ws://127.0.0.1:3000", {});

    const bds = new BDS(false);
    bds.on('data', () => console.log('create', bds.debug()))
    bds.on('delete', () => console.log('delete', bds.debug()))
    new bdsSioBridge('measures', bds).startClient(sio_client);
}

init();
