let Yaml = require('js-yaml');
let argv = require('yargs').argv;

if (!argv.cmap)
    return Logger.error(new Error('A file path for a control map was not specified'));

let FS = require('fs');
let OSCBridge = require('./modules/OSCBridge');

let Config = Yaml.safeLoad(FS.readFileSync('config.yaml'));
let cmappath = argv.cmap;
let Cmap = Yaml.safeLoad(FS.readFileSync(cmappath));

let osc = new OSCBridge(Config, Cmap);
osc.Open();
