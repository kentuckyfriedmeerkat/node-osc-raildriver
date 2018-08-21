import SVG from 'svg.js';
import _ from 'lodash';
import Everpolate from 'everpolate';

let defaultOptions = {
    radius: 100,
    valueTable: {
        0: 0,
        100: 270
    },
    background: {
        color: '#000000'
    },
    plainLabels: [],
    centre: {
        color: '#ffffff',
        radius: 0.08
    },
    needle: {
        outer: 0.25,
        inner: 1,
        stroke: {
            width: 3,
            color: '#aa3311'
        }
    }
    // ,
    // ticks: [{
    //     values: [ 0, 10, 20, 30, 40, 50, 70, 60, 80, 90, 100 ],
    //     style: {
    //         outer: 0,
    //         inner: 0.08,
    //         stroke: {
    //             width: 4,
    //             color: '#ffffff',
    //         },
    //         enableLabel: true,
    //         label: {
    //             inner: 0.19,
    //             color: '#ffffff'
    //         }
    //     }
    // }]
};

export default class RadialGauge {
    constructor(draw, options) {
        // Functions
        this.calculateAngleTable = (val, table) => Everpolate.linear(val, _.keys(table), _.values(table));

        // Setup options
        this.options = _.assign({}, defaultOptions, options);

        // Put svg on page
        this.draw = draw.viewbox(0, 0, this.options.radius, this.options.radius);

        this.gaugeBg = this.DrawBackground(this.options.background);
        if (this.options.ticks) for (let x of this.options.ticks)
            this.ticks = this.DrawTicks(x.values, x.style);
        this.needle = this.DrawNeedle(this.options.needle);
        if (this.options.centre) this.centre = this.DrawCentre(this.options.centre);
        if (this.options.auxiliaries) {
            this.auxiliaries = [];
            for (let x of this.options.auxiliaries)
                this.auxiliaries.push(x(this.draw));
        }
        this.plains = this.DrawPlains(this.options.plainLabels);
        this.SetValue(_.keys(this.options.valueTable)[0]);
    }
    DrawPlains(plains) {
        let rv = [];
        for (let plain of plains)
            rv.push(this.draw.plain(plain.text).fill(plain.fill || '#000000')
                .font(plain.font || {}).attr(plain.attr || {}));
        return rv;
    }
    DrawNeedle(needleOptions) {
        return this.draw.line(
            this.options.radius, // x1
            this.options.radius * (needleOptions.inner || 0), // y1
            this.options.radius, // x2
            this.options.radius * (needleOptions.outer || 0) // y2
        ).stroke(needleOptions.stroke);
    }
    DrawBackground(bgOptions) {
        return this.draw.circle(this.options.radius * 2)
            .attr(bgOptions);
    }
    DrawCentre(centreOptions) {
        return this.draw.circle(this.options.radius * centreOptions.radius * 2)
            .attr({ fill: centreOptions.color, cx: this.options.radius, cy: this.options.radius });
    }
    DrawTicks(tickList, ticksOptions) {
        let rv = [];
        for (let tick of tickList)
            rv.push(this.DrawTick(tick, ticksOptions));
        return rv;
    }
    DrawTick(val, tickOptions, log) {
        let gp = this.draw.group();
        let angle = this.calculateAngleTable(val, this.options.valueTable);
        gp.line(
            this.options.radius, // x1
            this.options.radius * tickOptions.outer, // y1
            this.options.radius, // x2
            this.options.radius * tickOptions.inner // y2
        ).stroke(tickOptions.stroke);
        if (tickOptions.enableLabel) gp.plain(val).attr({ x: this.options.radius, y: this.options.radius * tickOptions.label.inner })
            .attr({ fill: tickOptions.label.color }).font({ anchor: 'middle' }).rotate(-angle);
        return gp.rotate(angle, this.options.radius, this.options.radius);
    }
    SetValue(val, log) {
        this.needle.rotate(this.calculateAngleTable(val, this.options.valueTable), this.options.radius, this.options.radius);
    }
}
