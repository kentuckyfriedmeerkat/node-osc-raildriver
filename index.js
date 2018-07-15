let FS = require('fs');
let OSC = require('osc');
let Path = require('path-parser').default;
let _ = require('lodash');
let Numbro = require('numbro');
let RailDriver = require('./raildriver');

let Config = JSON.parse(FS.readFileSync('config.json'));
let Cmap = JSON.parse(FS.readFileSync(process.argv[2]));

let rd = new RailDriver(Config.dll);

// ---------------------------------------------------
const addressPath = new Path('/control/:id');
const suspensionDuration = 75;
const updateInterval = 20;

let suspensions = {};
let previousVal = {};
let oscPort = new OSC.UDPPort(Config.port);

let sendControl = (address, val, type) => {
    if (suspensions[address]) return;
    // console.debug(`Tx ${address}: ${val}`);
    oscPort.send({
        address: `/control/${address}`,
        args: [{
            type: type,
            value: val
        }]
    });
};

let messageReceived = msg => {
    let parsedPath = addressPath.partialTest(msg.address);
    if (!parsedPath) return;
    let val = msg.args[0].value;
    console.debug(`Rx ${parsedPath.id}: ${val}`);
    if (suspensions[parsedPath.id]) {
        suspensions[parsedPath.id]();
    }
    else {
        console.debug(`Is ${parsedPath.id}`);
        suspensions[parsedPath.id] = _.debounce(() => {
            suspensions[parsedPath.id] = null;
            console.debug(`Ls ${parsedPath.id}`);
        }, suspensionDuration);
        suspensions[parsedPath.id]();
    }
    rd.SetControllerValue(parsedPath.id, val);
};

let oscError = error => {
    console.debug(`OSC error! ${error}`);
};

let cmapFormat = (c, val, format) => {
    let _form = format || Cmap[c].format || null;
    if (_form)
        val = Numbro(val).format(_form);
    return val;
}

let sendCmapControllerValues = () => {
    for (let c in Cmap) {
        if (suspensions[c]) continue;
        if (!rd.Controllers[c]) {
            delete Cmap[c];
            continue;
        }
        let rval = rd.GetControllerValue(c);
        if (Cmap[c].maskneg && rval < 0) {
            sendControl(c, '', 's');
            continue;
        }
        let cval = cmapFormat(c, rval);
        if (!previousVal[c] || previousVal[c] != cval) previousVal[c] = cval;
        else continue;
        sendControl(c, cval, 's');
        if (Cmap[c].dupl) for (let i in Cmap[c].dupl)
            sendControl(`${c}/${i}`, cmapFormat(c, rval, Cmap[c].dupl[i]), 's')
        if (Cmap[c].outsplit) for (let i in Cmap[c].outsplit) {
            let x = Cmap[c].outsplit;
            let val = null;
            if (typeof x[i] == 'number') val = cval == x[i]? 1 : 0;
            else if (Array.isArray(x[i])) val = x[i].includes(cval);
            sendControl(`${c}_split${i}`, val, 'f')
        }
        if (Cmap[c].remap)
            sendControl(`${Cmap[c].remap.id}`, Cmap[c].remap.map[cval.toString()] || "Error", 's')
    }
}

oscPort.open();
let updIntervalRef = 0;
oscPort.on('ready', () => {
    rd.Connect();
    console.log('Ready');
    updIntervalRef = setInterval(sendCmapControllerValues, updateInterval);
    oscPort.on('message', messageReceived);
    oscPort.on('error', oscError);
});
