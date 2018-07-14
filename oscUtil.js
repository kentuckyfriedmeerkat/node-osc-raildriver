let OSC = require('osc');
let Vorpal = require('vorpal')();
let _ = require('lodash');
let Path = require('path-parser').default;

let osc = {};
let portOpen = false;

let internalOptions = {
    lhost: '0.0.0.0',
    lport: 57121
};

let oscReady = () => {
    console.log('OSC port opened');
    portOpen = true;
    Vorpal.ui.redraw.done();
};

let oscMessageReceived = msg => {
    console.log(`Message received: ${JSON.stringify(msg)}`);
    Vorpal.ui.redraw.done();
};

let argPathParser = new Path(':format/:value');

let parseArgs = args => {
    let temp = [];
    for (let arg of args) {
        let parse = argPathParser.test(arg);
        if (!parse) return null;
        temp.push({
            type: parse.format,
            value: type.val
        });
    }
    return temp;
}

Vorpal.command('open', 'Open the OSC port')
    .action((args, callback) => {
        if (portOpen) {
            console.log('Port already open');
            callback();
            return;
        }
        if (!internalOptions.lhost) console.log('lhost not set');
        if (!internalOptions.lport) console.log('lport not set');
        if (!internalOptions.lport || !internalOptions.lhost) { callback(); return; }
        try {
            osc = new OSC.UDPPort({
                localAddress: internalOptions.lhost,
                localPort: parseInt(internalOptions.lport)
            });
            osc.on('ready', oscReady);
            osc.on('message', oscMessageReceived);
            osc.open();
        } catch (error) {
            console.log(`Error opening OSC port: ${error}`);
        }
        callback();
    });

Vorpal.command('close', 'Close the OSC port')
    .action((args, callback) => {
        if (!portOpen) {
            console.log('Port already closed');
            callback();
            return;
        }
        try {
            osc.close();
            portOpen = false;
        } catch (error) {
            console.log(`Error closing OSC port: ${error}`);
        }
        callback();
    })

Vorpal.command('send <addr> [args...]', 'Send an OSC message')
    .action((args, callback) => {
        if (!portOpen) {
            console.log('Port not open');
            callback();
            return;
        }
        if (!internalOptions.rhost) console.log('rhost not set');
        if (!internalOptions.rport) console.log('rport not set');
        if (!internalOptions.rport || !internalOptions.rhost) { callback(); return; }
        try {
            osc.send({
                address: args.addr,
                args: args.args
            }, internalOptions.rhost, internalOptions.rport)
        } catch (error) {
            console.log(`Error sending OSC message: ${error}`);
        }
        callback();
    });

Vorpal.command('list', 'List currently set internal options')
    .action((args, callback) => {
        console.log(_.keys(internalOptions));
        callback();
    })

Vorpal.command('get <opt>', 'Get the value of an internal option')
    .action((args, callback) => {
        console.log(internalOptions[args.opt] || 'Not found');
        callback();
    });

Vorpal.command('set <opt> <value>', 'Set the value of an internal option')
    .action((args, callback) => {
        internalOptions[args.opt] = args.value;
        callback();
    });

Vorpal.command('unset <opt>', 'Unset an internal option')
    .action((args, callback) => {
        if (internalOptions[args.opt]) delete internalOptions[args.opt];
        else console.log('Not found');
        callback();
    })

Vorpal.delimiter('osc$').show();
