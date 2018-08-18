let Yaml = require('js-yaml');
let Express = require('express');
let Stylus = require('stylus');
let FS = require('fs');
let Path = require('path');
let OSCBridge = require('./modules/OSCBridge');

let argv = require('yargs').argv;

if (!argv.cmap)
    return console.log(new Error('A file path for a control map was not specified'));

let Config = Yaml.safeLoad(FS.readFileSync('config.yaml'));
let cmappath = argv.cmap;
let Cmap = Yaml.safeLoad(FS.readFileSync(cmappath));

let app = new Express();
app.set('view engine', 'pug');
app.set('views', Path.join(__dirname, 'views'));
app.use(Stylus.middleware({
    src: Path.join(__dirname, 'styl'),
    dest: Path.join(__dirname, 'out'),
    compile: (str, path) => Stylus(str)
        .set('filename', path)
        .set('compress', true)
}));
app.use('/out', Express.static(Path.join(__dirname, 'out')));
app.use('/lib', Express.static(Path.join(__dirname, 'node_modules')));
app.use('/pub', Express.static(Path.join(__dirname, 'public')));
app.get('/', (req, res) => res.render('index'));

let osc = new OSCBridge(Config, Cmap);
osc.Open();

app.listen(3000, () => {
    console.log('Listening on 3000');
});
