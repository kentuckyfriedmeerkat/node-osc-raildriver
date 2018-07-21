let RailDriver = require('./modules/raildriver');
let fs = require('fs');
let config = JSON.parse(fs.readFileSync('config.json'));

let rd = new RailDriver(config.dll);
rd.Connect();

for (let c in rd.Controllers) {
    let min = rd.GetControllerMin(c);
    let max = rd.GetControllerMax(c);
    let cur = rd.GetControllerValue(c);
    console.log(`${c}: Min ${min}, current ${cur}, max ${max}`);
}

rd.Disconnect();
