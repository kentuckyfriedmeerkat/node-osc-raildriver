import SocketIOClient from 'socket.io-client';
import { RadialGauge } from './SVGGauge.js';

let io = new SocketIOClient();

const radius = 200;
let gauges = {};

io.on('packets', msg => {
    for (let packet in msg) {
        if (gauges[packet]) gauges[packet].SetValue(msg[packet]);
    }
});

let controls_received = false;

io.on('webcontrols', webcontrols => {
    if (controls_received) return;
    for (let wcid in webcontrols) {
        let wcobj = webcontrols[wcid];
        let elem = document.getElementById(`gauge_${wcid}`);
        if (!elem) {
            elem = document.createElement('div');
            elem.id = `gauge_${wcid}`;
            elem.classList = 'gauge';
            Object.assign(elem.style, wcobj.style || {});
            document.body.appendChild(elem);
        }
        switch (wcobj.type) {
            case 'RadialGauge':
                gauges[wcid] = new RadialGauge(`gauge_${wcid}`, wcobj.options);
                break;
            default:
                continue;
        }
    }
    document.getElementById('loading').remove();
    controls_received = true;
});

io.emit('webcontrols');
