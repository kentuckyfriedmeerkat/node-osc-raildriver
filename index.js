let Yaml = require('js-yaml');
let argv = require('yargs').argv;
let Express = require('express');
let Path = require('path');
let Signale = require('signale').Signale;
let HTTP = require('http');
let SocketIO = require('socket.io');
let FS = require('fs');
let OSCBridge = require('./modules/OSCBridge');
let IOBridge = require('./modules/IOBridge');

const port = 3000;

let Logger = new Signale({
    scope: 'index.js'
});

if (!argv.cmap)
    return Logger.error(new Error('A file path for a control map was not specified'));

let Config = Yaml.safeLoad(FS.readFileSync('config.yaml'));
let cmappath = argv.cmap;
let Cmap = Yaml.safeLoad(FS.readFileSync(cmappath));

// let osc = new OSCBridge(Config, Cmap);
// osc.Open();

let app = new Express();
let server = new HTTP.Server(app);
let io = new SocketIO(server);

app.set('view engine', 'pug');
app.set('views', Path.join(__dirname, 'views'));
app.use('/public', Express.static(Path.join(__dirname, 'public')));
app.get('/', (req, res) => res.render('index'));

server.listen(port, () => {
    Logger.start(`Server listening on ${port}`);
    let bridge = new IOBridge(Config, Cmap, io);
});
