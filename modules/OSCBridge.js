let URLPattern = require('url-pattern');
let OSC = require('osc');
let Numbro = require('numbro');
let _ = require('lodash');
let Signale = require('signale').Signale;
let Logger = new Signale({
    scope: 'oscbridg'
});
let RailDriver = require('./RailDriver');
let { formatValue, filterValue, formPacket, postmap, closest } =
    require('./BridgeCommon')

let _rd = {};
let _suspensions = {};
let _previousVal = {};
let _cmap = {};
let _oscPort = {};
let _config = {};

const addressPath = new URLPattern('/control/:id(/:command)');
const suspensionDuration = 75;
const updateInterval = 20;


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
