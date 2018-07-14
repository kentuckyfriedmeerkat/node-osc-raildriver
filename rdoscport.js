let osc = require('osc');
let numeral = require('numeral');

const updateInterval = 50;

let _rd = {};
let _cmap = {};
let _previousVal = {};
let _oscPort = {};

let SendControl = (address, val) => {
    _oscPort.send({
        address: `/control/${address}`,
        args: [{
            type: 'f',
            value: val
        }]
    });
}

let MessageReceived = msg => {
    console.log(JSON.stringify(msg));
    let ada = msg.address.substring(1).split('/');
    if (ada[0] == 'control') _rd.SetControllerValue(ada[1], msg.args[0].value);
}

let SendCmapControllerValues = () => {
    for (let c in _cmap) {
        if (!_rd.Controllers[c]) continue;
        let rval = _rd.GetControllerValue(c);
        if (!_previousVal[c] || _previousVal[c] != rval) _previousVal[c] = rval;
        else continue;
        let cval = _cmap[c] === null? rval : numeral(rval).format(_cmap[c].format);
        SendControl(c, cval);
    }
}

module.exports = class RDOSCPort {
    constructor(rd, config, cmap) {
        _rd = rd;
        _cmap = cmap;
        _oscPort = new osc.UDPPort(config);
        _oscPort.open();
        _oscPort.on('ready', () => {
            _rd.Connect();
            console.log('Ready');
            this.updInterval = setInterval(SendCmapControllerValues, updateInterval);
            _oscPort.on('message', MessageReceived);
        });
    }
}
