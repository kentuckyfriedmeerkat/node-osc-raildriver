let Blessed = require('blessed');
let Numbro = require('numbro');
let RailDriver = require('./modules/RailDriver');
let Config = JSON.parse(require('fs').readFileSync('./config.json'));

let rd = new RailDriver(Config.dll);
rd.Connect();

let screen = Blessed.screen({
    smartCSR: true
});

screen.title = 'RD Monitor';
screen.key(['escape', 'q', 'C-c'], () => process.exit(0));

let controllers = {
    'DisplaySpeedometer': { format: { mantissa: 1 } },
    'TVMArmed': {},
    'TVMCurrentBlockSpeed': {},
    'TVMDisplayValue': {},
    'TVMChanging': {},
    'TVMEnable': {},
    'TVMSelfTest': {}
};

let keyList = new Blessed.list({
    width: 20
});
let valueList = new Blessed.list({
    left: 21
});
screen.append(keyList);
screen.append(valueList);
for (let c in controllers) {
    keyList.addItem(c);
    valueList.addItem('000');
}

screen.render();

setInterval(() => {
    valueList.clearItems();
    for (let c in controllers) {
        let controllerValue = rd.GetControllerValue(c);
        valueList.addItem(((controllers[c].format? Numbro(controllerValue).format(controllers[c].format) : controllerValue)).toString());
    }
    screen.render();
}, 50);
