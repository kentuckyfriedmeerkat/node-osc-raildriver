let RailDriver = require('./modules/raildriver');
let Yaml = require('js-yaml');
let fs = require('fs');
let config = Yaml.safeLoad(fs.readFileSync('config.yaml'));

let rd = new RailDriver(config.dll);
rd.Connect();

for (let c in rd.Controllers) {
    let min = rd.GetControllerMin(c);
    let max = rd.GetControllerMax(c);
    let cur = rd.GetControllerValue(c);
    console.log(`${c}: Min ${min}, current ${cur}, max ${max}`);
}

rd.Disconnect();
