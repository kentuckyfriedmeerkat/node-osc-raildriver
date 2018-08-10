let Signale = require('signale').Signale;
let Logger = new Signale({ scope: 'globscop' });
let Yaml = require('js-yaml');

if (!process.argv[2])
    return Logger.error(new Error('A file path for a control map was not specified'));

let FS = require('fs');
let RailDriver = require('./modules/RailDriver');
let OSCBridge = require('./modules/OSCBridge');

let Config = JSON.parse(FS.readFileSync('config.json'));
let cmappath = process.argv[2];
let Cmap;
if (cmappath.endsWith('.json'))
    Cmap = JSON.parse(FS.readFileSync(process.argv[2]));
else if (cmappath.endsWith('.yaml'))
    Cmap = Yaml.safeLoad(FS.readFileSync(process.argv[2]));
else
    throw new Error('fook off');

let rd = new RailDriver(Config.dll);
let osc = new OSCBridge(rd, Config.port, Cmap);
osc.Open();
