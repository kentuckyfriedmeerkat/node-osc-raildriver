let http = require('http');
let fs = require('fs');
let RailDriver = require('./raildriver');
let RDOSCPort = require('./rdoscport');

let cmap = JSON.parse(fs.readFileSync(process.argv[2]));
let config = JSON.parse(fs.readFileSync('config.json'));

let rd = new RailDriver(config.dll);

let rdosc = new RDOSCPort(rd, config.port, cmap);
