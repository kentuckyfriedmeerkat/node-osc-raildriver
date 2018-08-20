import SocketIOClient from 'socket.io-client';
import RadialGauge from './RadialGauge.js';

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
        console.log(`Drawing ${wcid}...`);
        let wcobj = webcontrols[wcid];
        let elem_id = `control_${wcid}`;
        let elem = document.getElementById(elem_id);
        if (!elem) {
            elem = document.createElement('div');
            elem.id = elem_id;
            elem.classList = 'gauge';
            Object.assign(elem.style, wcobj.style || {});
            document.body.appendChild(elem);
        }
        switch (wcobj.type) {
            case 'RadialGauge':
                gauges[wcid] = new RadialGauge(elem_id, wcobj.options);
                break;
            default:
                continue;
        }
    }
    document.getElementById('loading').remove();
    controls_received = true;
});

io.emit('webcontrols');
