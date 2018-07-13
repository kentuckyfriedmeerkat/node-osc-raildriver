let http = require('http');
let osc = require('osc');
let fs = require('fs');
let numeral = require('numeral');
let RailDriver = require('./raildriver');

let cmap = JSON.parse(fs.readFileSync(process.argv[2]));
let config = JSON.parse(fs.readFileSync('config.json'));

let rd = new RailDriver(config.dll);

let oscPort = new osc.UDPPort(config.port);

const updateInterval = 50;

oscPort.open();

oscPort.on('ready', () => {
    console.log('OSC port ready');
    rd.Connect();
    console.log(rd.GetLocoName());
    rd.UpdateControllerList();
    // console.log(rd.Controllers);

    let sendLocoName = () => {
        oscPort.send({
            address: '/control/locoName',
            args: [
                {
                    type: 's',
                    value: rd.GetLocoName().Model
                }
            ]
        });
    };
    sendLocoName();

    let previousVal = {};

    setInterval(() => {
        for (let c in cmap) {
            if (!rd.Controllers[c]) continue;
            let rval = rd.GetControllerValue(c);
            if (!previousVal[c] || previousVal[c] != rval) previousVal[c] = rval;
            else if (previousVal[c] == rval) continue;
            let cval = cmap[c] === 0? rval : numeral(rval).format(cmap[c]);
            oscPort.send({
                address: `/control/${c}`,
                args: [{
                    type: 'f',
                    value: cval
                }]
            })
        }
    }, updateInterval);

    oscPort.on('message', msg => {
        let ada = msg.address.substring(1).split('/');
        if (ada[0] == 'control') {
            rd.SetControllerValue(ada[1], msg.args[0].value);
        }
    });
});
