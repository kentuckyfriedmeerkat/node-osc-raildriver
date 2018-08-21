let Yaml = require('js-yaml');
let argv = require('yargs').argv;
let Express = require('express');
let Path = require('path');
let Signale = require('signale').Signale;
let HTTP = require('http');
let SocketIO = require('socket.io');
let FS = require('fs');
let Stylus = require('stylus');
let IOBridge = require('./modules/IOBridge');
let RailDriver = require('./modules/RailDriver');
let _ = require('lodash');

let yamlSchema = Yaml.Schema.create([
    new Yaml.Type('!range', {
        kind: 'sequence',
        construct: data => _.range(data[0], data[1] + data[2], data[2])
    })
]);

let Logger = new Signale({
    scope: 'index.js'
});

if (!argv.cmap)
    return Logger.error(new Error('A file path for a control map was not specified'));

let Config = Yaml.safeLoad(FS.readFileSync('config.yaml'));
let cmappath = argv.cmap;
let Cmap = Yaml.safeLoad(FS.readFileSync(cmappath), { schema: yamlSchema });

// let osc = new OSCBridge(Config, Cmap);
// osc.Open();

let app = new Express();
let server = new HTTP.Server(app);
let io = new SocketIO(server);
let rd = new RailDriver(Config.dll, Cmap.intercepts);

app.set('view engine', 'pug');
app.set('views', Path.join(__dirname, 'views'));
app.use(Stylus.middleware({
    src: Path.join(__dirname, 'styl'),
    dest: Path.join(__dirname, 'css'),
    compile: (str, path) => Stylus(str)
        .set('filename', path)
        .set('compress', true)
}));
app.use('/css', Express.static(Path.join(__dirname, 'css')));
app.use('/public', Express.static(Path.join(__dirname, 'public')));
app.get('/', (req, res) => res.render('index'));

server.listen(Config.port, () => {
    Logger.start(`Server listening on ${Config.port}`);
    let bridge = new IOBridge(Config, Cmap, rd, io);
});
