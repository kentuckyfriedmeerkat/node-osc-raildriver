import SocketIOClient from 'socket.io-client';

let io = new SocketIOClient();

io.on('packets', console.log('packet'));
