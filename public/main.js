import SocketIOClient from 'socket.io-client';
import { RadialGauge } from './SVGGauge.js';

let io = new SocketIOClient();

const radius = 200;

let gauges = {
    Speedometer: new RadialGauge('gauge_Speedometer', {
        radius,
        minValue: 0,
        maxValue: 100,
        auxiliaries: [
            $ => $.plain('mile/h').fill('#ffffff')
                .font({ anchor: 'middle' })
                .attr({ x: radius, y: radius * 1.5 })
        ],
        background: {
            color: '#222222'
        },
        centre: {
            color: '#000000',
            radius: 0.08
        },
        needle: {
            outer: 0.25,
            inner: 0.15,
            stroke: {
                width: 3,
                color: '#aa3311'
            }
        },
        ticks: [{
            values: [ 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100 ],
            style: {
                outer: 0,
                inner: 0.08,
                stroke: {
                    width: 4,
                    color: '#ffffff',
                },
                enableLabel: true,
                label: {
                    inner: 0.19,
                    color: '#ffffff'
                }
            }
        }, {
            values: [ 5, 15, 25, 35, 45, 55, 65, 85, 95 ],
            style: {
                outer: 0,
                inner: 0.05,
                stroke: {
                    width: 2,
                    color: '#6a6a6a',
                }
            }
        }, {
            values: [ 75 ],
            style: {
                outer: 0,
                inner: 0.05,
                stroke: {
                    width: 4,
                    color: '#aa3311',
                }
            }
        }]
    })
};

io.on('packets', msg => {
    for (let packet in msg) {
        if (gauges[packet]) gauges[packet].SetValue(msg[packet]);
    }
});
