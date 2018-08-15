let URLPattern = require('url-pattern');
let OSC = require('osc');
let Numbro = require('numbro');
let _ = require('lodash');
let Signale = require('signale').Signale;
let Logger = new Signale({
    scope: 'oscbridg'
});
let RailDriver = require('./RailDriver');

let _rd = {};
let _suspensions = {};
let _previousVal = {};
let _cmap = {};
let _oscPort = {};
let _config = {};

const addressPath = new URLPattern('/control/:id(/:command)');
const suspensionDuration = 75;
const updateInterval = 20;

let closest = (num, arr) => {
    let curr = arr[0];
    let diff = Math.abs(num - curr);
    for (let val = 0; val < arr.length; val++) {
        let newdiff = Math.abs(num - arr[val]);
        if (newdiff < diff) {
            diff = newdiff;
            curr = arr[val];
        }
    }
    return curr;
};

let messageReceived = msg => {
    // Parse the path
    let parsedPath = addressPath.match(msg.address);
    parsedPath.id = parsedPath.id.replace('+', ' ');

    // If it's unusable, discard it
    if (!parsedPath)
        return Logger.info(`Discarded an unusable path ${msg.address}`);

    let val = msg.args[0].value;

    // Suspensions: when an input is received, suspend sending messages
    // for that control until it has stopped sending messages for
    // the suspension duration (e.g. 75 ms)
    if (_suspensions[parsedPath.id]) _suspensions[parsedPath.id]();
    else {
        _suspensions[parsedPath.id] = _.debounce(() => {
            _suspensions[parsedPath.id] = null;
        }, suspensionDuration);
        _suspensions[parsedPath.id]();
    }

    // Notches
    if (_cmap[parsedPath.id] && _cmap[parsedPath.id].notches) {
        val = closest(val, _cmap[parsedPath.id].notches);
    }

    _rd.SetControllerValue(parsedPath.id, val);
};

let oscError = error => {
    Logger.error(error);
};

let formatValue = (c, val, format) => {
    let _form = format || _cmap[c].format || null;
    if (_form === null) return val;
    let cval = Numbro(val).format(_form);
    debugger;
    return cval;
};

let filterValue = (c, rval) => {
    if (_cmap[c].maskneg && rval < 0) return '';
    return formatValue(c, rval);
};

let formPacket = (c, cval) => {
    return {
        address: `/control/${c}`,
        args: [{
            type: 's',
            value: cval
        }]
    };
};

let postmap = (c, rval, cval) => {
    let packets = [];

    // Duplicate values with different formats
    if (_cmap[c].dupl) {
        if (!Array.isArray(_cmap[c].dupl)) _cmap[c].dupl = [_cmap[c].dupl];
        for (let i in _cmap[c].dupl)
            packets.push(formPacket(`${c}/dupl/${i}`, formatValue(c, cval, _cmap[c].dupl[i])));
    }

    // Todo: change from _split to /split/ or something similar
    // Create an output c == i to get around TouchOSC LED limitations
    if (_cmap[c].outsplit) for (let i in _cmap[c].outsplit) {
        let x = _cmap[c].outsplit;
        let val = null;
        if (typeof x[i] == 'number') val = cval == x[i]? 1 : 0;
        else if (Array.isArray(x[i])) val = x[i].includes(cval)? 1 : 0;
        packets.push(formPacket(`${c}/split/${i}`, val));
    }

    // Todo: rename to 'namemap'
    // Map values to a hash, e.g. numbers to strings
    if (_cmap[c].remap) {
        if (!Array.isArray(_cmap[c].remap)) _cmap[c].remap = [ _cmap[c].remap ];
        for (let item in _cmap[c].remap)
            packets.push(formPacket(`${c}/remap/${_cmap[c].remap.id}`, _cmap[c].remap.map[cval.toString()] || ''));
    }

    if (_cmap[c].receiver)
        packets.push(formPacket(`${c}/r`, cval));

    return packets;
};

let sendCmapControllerValues = (trackPrevious = true) => {
    let bundle = { timeTag: OSC.timeTag(0), packets: [] };
    for (let c in _cmap) {
        let suspended = false;

        // If there's a suspension in place for the current
        // OSC address, skip to the next one
        if (_suspensions[c]) suspended = true;
        
        // If the controller doesn't actually exist in RailWorks,
        // forget about it in the Cmap, and then skip to the next
        if (!_rd.Controllers[c]) {
            delete _cmap[c];
            continue;
        }

        // Get the current raw value for the controller
        let rval = _rd.GetControllerValue(c);

        // Filter the value with coding and algorithms
        let cval = filterValue(c, rval);

        // Keeping track of previous values to try and
        // reduce network traffic by not sending unchanged
        // values
        if (!suspended) {
            if (!_previousVal[c] || _previousVal[c] != cval)
                _previousVal[c] = cval;
            else if (trackPrevious) continue; // Don't send if it's the same

            // If everything else works, send the control value
            // sendControl(c, cval, 's');
            bundle.packets.push(formPacket(c, cval));
        }

        // Now do post-map things with it
        for (let i of postmap(c, rval, cval)) {
            bundle.packets.push(i);
        }
    }
    _oscPort.send(bundle);
};

module.exports = class OSCBridge {
    constructor(config, cmap) {
        _rd = new RailDriver(config.dll, cmap.intercepts);
        _cmap = cmap.base;
        _config = config.port;
        _oscPort = new OSC.UDPPort(_config);
        _oscPort.on('ready', () => {
            _rd.Connect();
            Logger.success('Ready');
            setInterval(sendCmapControllerValues, updateInterval);
            _oscPort.on('message', messageReceived);
            _oscPort.on('error', oscError);
        });
    }

    Open() {
        _oscPort.open();
    }
};
