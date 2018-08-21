import $ from 'jquery';
import SocketIOClient from 'socket.io-client';
import RadialGauge from './RadialGauge.js';
import LEDGauge from './LEDGauge.js';

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
    for (let wcobj of webcontrols) {
        let wcid = wcobj.control;
        console.log(`Drawing ${wcid}...`);
        let elem = document.createElement('div');
        elem.setAttribute('data-control', wcid);
        elem.classList = 'gauge';
        Object.assign(elem.style, wcobj.style || {});
        $('body').append(elem);
        switch (wcobj.type) {
            case 'RadialGauge':
                gauges[wcid] = new RadialGauge(elem, wcobj.options);
                break;
            case 'LEDGauge':
                gauges[wcid] = new LEDGauge(elem, wcobj.options);
                break;
            default:
                continue;
        }
    }
    document.getElementById('loading').remove();
    controls_received = true;
});

io.emit('webcontrols');
