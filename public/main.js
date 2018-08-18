let SVGGauge = require('./SVGGauge.js');

let g = new SVGGauge.RadialGauge('gauge1', {
    radius: 200,
    minValue: 0,
    maxValue: 100,
    minAngle: 225,
    totalAngle: 270,
    auxiliaries: [
        $ => $.plain('mile/h').fill('#ffffff')
            .font({ anchor: 'middle' })
            .attr({ x: 200, y: 300 })
    ],
    background: {
        color: '#222222'
    },
    centre: {
        color: '#000000',
        radius: 0.08
    },
    needle: {
        gap: 0.25,
        extension: 0.15,
        stroke: {
            width: 3,
            color: '#aa3311'
        }
    },
    ticks: [{
        values: [ 0, 10, 20, 30, 40, 50, 70, 60, 80, 90, 100 ],
        style: {
            outerGap: 0,
            innerExtent: 0.08,
            stroke: {
                width: 4,
                color: '#ffffff',
            },
            label: {
                extent: 0.19,
                color: '#ffffff'
            }
        }
    }, {
        values: [ 5, 15, 25, 35, 45, 55, 65, 85, 95 ],
        style: {
            outerGap: 0,
            innerExtent: 0.05,
            stroke: {
                width: 2,
                color: '#6a6a6a',
            }
        }
    }, {
        values: [ 75 ],
        style: {
            outerGap: 0,
            innerExtent: 0.05,
            stroke: {
                width: 4,
                color: '#aa3311',
            }
        }
    }]
});
// g.SetNeedle(20);
