import $ from 'jquery';
import SocketIOClient from 'socket.io-client';
import RadialGauge from './RadialGauge.js';
import LEDGauge from './LEDGauge.js';
import SVG from 'svg.js';
import _ from 'lodash';

let io = new SocketIOClient();

const radius = 200;

$('body').append(`<div id='svgCanvas'></div>`);
let svgCanvas = SVG('svgCanvas').viewbox(0, 0, 1600, 900);
svgCanvas.rect(1600, 900).fill('#000000');
let gauges = [];

let drawGrid = () => {
    // vertical
    for (let i = 25; i < 1600; i += 25) // minor
        svgCanvas.line(i, 0, i, 900).stroke({ width: 0.5, color: '#2a2a2a' });
    for (let i = 100; i < 1600; i += 100) // major
        svgCanvas.line(i, 0, i, 900).stroke({ width: 1, color: '#3d3d3d' });

    // horizontal
    for (let i = 25; i < 900; i += 25) // minor
        svgCanvas.line(0, i, 1600, i).stroke({ width: 0.5, color: '#2a2a2a' });
    for (let i = 100; i < 900; i += 100) // major
        svgCanvas.line(0, i, 1600, i).stroke({ width: 1, color: '#3d3d3d' });
};
// drawGrid();

io.on('packets', msg => {
    for (let packet in msg) {
        _.chain(gauges)
        .filter(o => o.wcid === packet)
        .each(o => o.gauge.SetValue(msg[packet]))
        .commit();
    }
});

let controls_received = false;

io.on('webcontrols', webcontrols => {
    if (controls_received) return;
    console.log('Receiving controls...');
    for (let wcobj of webcontrols) {
        let wcid = wcobj.control;
        console.log(`Drawing ${wcid}...`);
        let nest = svgCanvas.nested();
        switch (wcobj.type) {
            case 'RadialGauge':
                gauges[wcid] = new RadialGauge(nest, wcobj.options);
                break;
            // case 'LEDGauge':
            //     gauges.push(new LEDGauge(elem, wcobj.options));
            //     break;
            default:
                continue;
        }
        gauges.push({ wcid, gauge: gauges[wcid] });
        nest.attr(wcobj.attr);
    }
    document.getElementById('loading').remove();
    controls_received = true;
});

io.emit('webcontrols');
