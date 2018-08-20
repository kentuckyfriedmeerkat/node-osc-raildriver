let _ = require('lodash');
let URLPattern = require('url-pattern');
let Signale = require('signale').Signale;
let Logger = new Signale({
    scope: 'iobridge'
});
let Events = require('events');

const addressPath = new URLPattern('/control/:id(/:command)');
const suspensionDuration = 75;
const updateInterval = 20;

module.exports =
class IOBridge extends Events.EventEmitter {
    constructor(config, cmap, rd, io) {
        super();
        this.io = io;
        this.rd = rd;
        this.cmap = cmap;
        this.suspensions = {};
        this.previousVal = {};
        this.rd.Connect();
        setInterval(this.SendCmapValues.bind(this), updateInterval);
        Logger.success('IOBridge ready');

        this.on('packets', packets => io.emit('packets', packets));

        this.io.on('connection', socket => {
            Logger.info('Connection');

            socket.on('webcontrols', () => {
                io.emit('webcontrols', this.cmap.webcontrols);
            });
        });
    }

    SendCmapValues() {
        let generatedPackets = this.GeneratePackets();
        if (_.keys(generatedPackets).length)
            this.emit('packets', generatedPackets);
    }

    GeneratePackets(trackPrevious = true) {
        let packets = {};
        for (let cmapItem in this.cmap.intercepts) {
            let suspended = this.suspensions[cmapItem]? true : false;
            if (!this.rd.Controllers[cmapItem]) {
                delete this.cmap[cmapItem];
                continue;
            }
            let cval = this.rd.GetControllerValue(cmapItem);
            if (!suspended) {
                if (!this.previousVal[cmapItem] ||
                    this.previousVal[cmapItem] != cval)
                    this.previousVal[cmapItem] = cval;
                else if (trackPrevious) continue;

                packets[cmapItem] = cval;
            }
        }
        return packets;
    }
}
