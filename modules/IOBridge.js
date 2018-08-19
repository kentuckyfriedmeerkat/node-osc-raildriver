let _ = require('lodash');
let URLPattern = require('url-pattern');
let Signale = require('signale').Signale;
let Logger = new Signale({
    scope: 'iobridge'
});
let RailDriver = require('./RailDriver');
let Events = require('events');
let BridgeCommon = require('./BridgeCommon')

const addressPath = new URLPattern('/control/:id(/:command)');
const suspensionDuration = 75;
const updateInterval = 20;

module.exports =
class IOBridge extends Events.EventEmitter {
    constructor(config, cmap, io) {
        super();
        this.io = io;
        this.cmap = cmap;
        this.suspensions = {};
        this.previousVal = {};
        this.bc = new BridgeCommon(this.cmap.base);
        this.rd = new RailDriver(config.dll, cmap.intercepts);
        this.rd.Connect();
        setInterval(this.SendCmapValues.bind(this), updateInterval);
        Logger.success('IOBridge ready');
        let self = this;

        this.io.on('connection', socket => {
            Logger.info('Connection');

            self.on('packets', packets => io.emit('packets', packets));
        });
    }

    SendCmapValues() {
        let generatedPackets = this.GeneratePackets();
        if (_.keys(generatedPackets).length)
            this.emit('packets', generatedPackets);
    }

    GeneratePackets(trackPrevious = true) {
        let packets = {};
        for (let cmapItem in this.cmap.base) {
            let suspended = this.suspensions[cmapItem]? true : false;
            if (!this.rd.Controllers[cmapItem]) {
                delete this.cmap[cmapItem];
                continue;
            }
            let cval = this.rd.GetControllerValue(cmapItem);
            // let cval = this.bc.filterValue(cmapItem, rval);
            if (!suspended) {
                if (!this.previousVal[cmapItem] ||
                    this.previousVal[cmapItem] != cval)
                    this.previousVal[cmapItem] = cval;
                else if (trackPrevious) continue;

                let packet = this.bc.formPacket(cmapItem, cval);
                packets[packet.address.replace('/control/', '')] = packet.args[0].value;
            }
            // for (let packet of this.bc.postmap(cmapItem, rval, cval))
            //     packets[packet.address] = packet.args[0].value;
        }
        return packets;
    }
}
