let FS = require('fs');
let OSC = require('osc');
let Path = require('path-parser').default;
let _ = require('lodash');
let Numeral = require('numeral');
let RailDriver = require('./raildriver');

let Config = JSON.parse(FS.readFileSync('config.json'));
let Cmap = JSON.parse(FS.readFileSync(process.argv[2]));

let rd = new RailDriver(Config.dll);

// ---------------------------------------------------
const addressPath = new Path('/control/:id');
const suspensionDuration = 500;
const updateInterval = 50;

let suspensions = {};
let previousVal = {};
let oscPort = new OSC.UDPPort(Config.port);

let sendControl = (address, val) => {
    if (suspensions[address]) return;
    // console.debug(`Tx ${address}: ${val}`);
    oscPort.send({
        address: `/control/${address}`,
        args: [{
            type: 'f',
            value: val
        }]
    });
};

let messageReceived = msg => {
    let parsedPath = addressPath.partialTest(msg.address);
    if (!parsedPath) return;
    let val = msg.args[0].value;
    // console.debug(`Rx ${parsedPath.id}: ${val}`);
    if (suspensions[parsedPath.id])
        suspensions[parsedPath.id]();
    else {
        // console.debug(`Is ${parsedPath.id}`);
        suspensions[parsedPath.id] = _.debounce(() => {
            suspensions[parsedPath.id] = null;
            // console.debug(`Ls ${parsedPath.id}`);
        }, suspensionDuration);
    }
    rd.SetControllerValue(parsedPath.id, val);
};

let cmapFormat = (c, val, format) => {
    let _form = format || Cmap[c].format || null;
    if (_form)
        val = Numeral(val).format(_form);
    return val;
}

let sendCmapControllerValues = () => {
    for (let c in Cmap) {
        if (suspensions[c]) continue;
        if (!rd.Controllers[c]) {
            delete cmap[c];
            continue;
        }
        let rval = rd.GetControllerValue(c);
        if (!previousVal[c] || previousVal[c] != rval) previousVal[c] = rval;
        else continue;
        let cval = cmapFormat(c, rval);
        sendControl(c, cval);
        if (Cmap[c].dupl) for (let i in Cmap[c].dupl)
            sendControl(`${c}_${i}`, cmapFormat(c, rval, Cmap[c].dupl[i]))
    }
}

oscPort.open();
let updIntervalRef = 0;
oscPort.on('ready', () => {
    rd.Connect();
    console.log('Ready');
    updIntervalRef = setInterval(sendCmapControllerValues, updateInterval);
    oscPort.on('message', messageReceived);
});
