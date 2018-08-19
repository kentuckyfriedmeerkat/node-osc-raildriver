import SVG from 'svg.js';

export class RadialGauge {
    constructor(id, options) {
        // Functions
        this.calculatePercentage = (val, min, max) => (val - min) / (max - min);
        this.calculateAngle = (val, min, max) => (this.calculatePercentage(val, min, max) * this.options.totalAngle) + this.options.minAngle;

        // Setup options
        this.id = id;
        this.options = options;
        for (let a of ['radius', 'minValue', 'maxValue'])
            if (this.options[a] === undefined) throw new Error(`${this.id} options object does not specify ${a}`);

        // Put svg on page
        console.log(`${this.id}: setup`);
        this.draw = SVG(this.id).viewbox(0, 0, this.options.radius * 2, this.options.radius * 2);

        if (this.options.background) this.gaugeBg = this.DrawBackground(this.options.background);
        this.needle = this.DrawNeedle(this.options.needle);
        if (this.options.centre) this.centre = this.DrawCentre(this.options.centre);
        if (this.options.ticks) for (let x of this.options.ticks)
            this.ticks = this.DrawTicks(x.values, x.style);
        if (this.options.auxiliaries) {
            this.auxiliaries = [];
            for (let x of this.options.auxiliaries)
                this.auxiliaries.push(x(this.draw));
        }
        this.SetNeedle(this.options.minValue);
    }
    DrawNeedle(needleOptions) {
        console.log(`${this.id}: drawing needle`);
        return this.draw.line(
            this.options.radius, // x1
            this.options.radius + this.options.radius * (needleOptions.inner || 0), // y1
            this.options.radius, // x2
            this.options.radius * (needleOptions.outer || 0) // y2
        ).stroke(needleOptions.stroke).id('needle');
    }
    DrawBackground(bgOptions) {
        console.log(`${this.id}: drawing background`);
        return this.draw.circle(this.options.radius * 2)
            .attr({ fill: bgOptions.color }).id('background');
    }
    DrawCentre(centreOptions) {
        console.log(`${this.id}: drawing centre`);
        return this.draw.circle(this.options.radius * centreOptions.radius * 2)
            .attr({ fill: centreOptions.color, cx: this.options.radius, cy: this.options.radius })
            .id('centre');
    }
    DrawTicks(tickList, ticksOptions) {
        let rv = [];
        for (let tick of tickList)
            rv.push(this.DrawTick(tick, ticksOptions));
        return rv;
    }
    DrawTick(val, tickOptions, log) {
        if (SVG.get(`tick${val}`)) throw new Error(`${this.id}: there are multiple ticks with value ${val}`);
        if (log) console.log(`${this.id}: drawing tick at ${val}`);
        let gp = this.draw.group();
        let angle = this.calculateAngle(val, this.options.minValue, this.options.maxValue);
        gp.line(
            this.options.radius, // x1
            this.options.radius * tickOptions.outer, // y1
            this.options.radius, // x2
            this.options.radius * tickOptions.inner // y2
        ).stroke(tickOptions.stroke) .id(`tickLine${val}`);
        if (tickOptions.label) gp.plain(val).attr({ x: this.options.radius, y: this.options.radius * tickOptions.label.inner })
            .attr({ fill: tickOptions.label.color }).font({ anchor: 'middle' }).rotate(-angle).id(`tickLabel${val}`);
        return gp.rotate(angle, this.options.radius, this.options.radius).id(`tick${val}`);
    }
    SetNeedle(val, log) {
        if (log) console.log(`${this.id}: setting needle to ${val}`);
        if (val < this.options.minValue) val = this.options.minValue;
        else if (val > this.options.maxValue) val = this.options.maxValue;
        this.needle.rotate(this.calculateAngle(val, this.options.minValue, this.options.maxValue), this.options.radius, this.options.radius);
    }
}
