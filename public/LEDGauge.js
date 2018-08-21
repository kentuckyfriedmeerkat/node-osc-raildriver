import SVG from 'svg.js';
import _ from 'lodash';
import Everpolate from 'everpolate';

let defaultOptions = {
    radius: 20,
    valueTable: {
        0: [ 50, 50, 50 ],
        1: [ 255, 255, 255 ]
    }
};

let pickMembers = (table, n) => _.map(table, x => x[n]);
let interpolateRgb = (val, table) => {
    let keys = _.keys(table);
    return [
        Everpolate.linear(val, keys, pickMembers(table, 0))[0],
        Everpolate.linear(val, keys, pickMembers(table, 1))[0],
        Everpolate.linear(val, keys, pickMembers(table, 2))[0],
    ] };
let rgbArrayToHex = array =>
    `#${array[0].toString(16)}${array[1].toString(16)}${array[2].toString(16)}`;

export default class LEDGauge {
    constructor(elem, options) {
        this.elem = elem;
        this.options = _.assign({}, defaultOptions, options);
        console.log(`${this.elem}: setup`);

        this.draw = SVG(this.elem).viewbox(0, 0, this.options.radius * 2, this.options.radius * 2);

        this.led = this.draw.circle(this.options.radius * 2)
            .attr({ fill: this.options.valueTable[_.keys(this.options.valueTable)[0]] })
    }
    SetValue(val) {
        this.led.fill(
            rgbArrayToHex(interpolateRgb(val, this.options.valueTable)));
    }
}
