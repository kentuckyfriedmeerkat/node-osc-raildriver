let Signale = require('signale').Signale;
let Logger = new Signale({ scope: 'globscop' });
if (!process.argv[2])
    return Logger.error(new Error('A file path for a control map was not specified'));

let FS = require('fs');
let RailDriver = require('./modules/RailDriver');
let OSCBridge = require('./modules/OSCBridge');

let Config = JSON.parse(FS.readFileSync('config.json'));
let Cmap = JSON.parse(FS.readFileSync(process.argv[2]));

let rd = new RailDriver(Config.dll);
let osc = new OSCBridge(rd, Config.port, Cmap);
osc.Open();
