let _ = require('lodash');
let URLPattern = require('url-pattern');
let Numbro = require('numbro');
let Signale = require('signale').Signale;
let Logger = new Signale({
    scope: 'iobridge'
});
let RailDriver = require('./RailDriver');
let Events = require('events');
let { formatValue, filterValue, formPacket, postmap, closest } =
    require('./BridgeCommon')

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
        this.rd = new RailDriver(config.dll, cmap.intercepts);
        this.rd.Connect();
        setInterval(this.SendCmapValues.bind(this), updateInterval);
        Logger.success('IOBridge ready');

        this.io.on('connection', socket => {
            Logger.info('Connection');
        });
    }

    SendCmapValues() {
        this.emit('packets', this.GeneratePackets());
    }

    GeneratePackets(trackPrevious = true) {
        let packets = {};
        for (let cmapItem in this.cmap) {
            let suspended = this.suspensions[cmapItem]? true : false;
            if (!this.rd.Controllers[cmapItem]) {
                delete this.cmap[cmapItem];
                continue;
            }
            let rval = this.rd.GetControllerValue(cmapItem);
            let cval = filterValue(cmapItem, rval);
            if (!suspended) {
                if (!this.previousVal[cmapItem] ||
                    this.previousVal[cmapItem] != cval)
                    this.previousVal[cmapItem] = cval;
                else if (trackPrevious) continue;

                // packets.push(formPacket(c, cval));
                let packet = formPacket(c, cval);
                packets[packet.address] = packet.args[0].value;
            }
            for (let packet of postmap(cmapItem, rval, cval))
                packets[packet.address] = packet.args[0].value;
        }
        return packets;
    }
}
