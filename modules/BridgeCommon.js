let Numbro = require('numbro');

module.exports =
class BridgeCommon {
    constructor(cmap) {
        this.cmap = cmap;
    }

    closest (num, arr) {
        let curr = arr[0];
        let diff = Math.abs(num - curr);
        for (let val = 0; val < arr.length; val++) {
            let newdiff = Math.abs(num - arr[val]);
            if (newdiff < diff) {
                diff = newdiff;
                curr = arr[val];
            }
        }
        return curr;
    };

    formatValue (c, val, format) {
        let _form = format || this.cmap[c].format || null;
        if (_form === null) return val;
        let cval = Numbro(val).format(_form);
        debugger;
        return cval;
    };

    filterValue (c, rval) {
        if (this.cmap[c].maskneg && rval < 0) return '';
        return this.formatValue(c, rval);
    };

    formPacket (c, cval) {
        return {
            address: `/control/${c}`,
            args: [{
                type: 's',
                value: cval
            }]
        };
    };

    postmap (c, rval, cval) {
        let packets = [];

        // Duplicate values with different formats
        if (this.cmap[c].dupl) {
            if (!Array.isArray(this.cmap[c].dupl)) this.cmap[c].dupl = [this.cmap[c].dupl];
            for (let i in this.cmap[c].dupl)
                packets.push(this.formPacket(`${c}/dupl/${i}`, this.formatValue(c, cval, this.cmap[c].dupl[i])));
        }

        if (this.cmap[c].outsplit) for (let i in this.cmap[c].outsplit) {
            let x = this.cmap[c].outsplit;
            let val = null;
            if (typeof x[i] == 'number') val = cval == x[i]? 1 : 0;
            else if (Array.isArray(x[i])) val = x[i].includes(cval)? 1 : 0;
            packets.push(this.formPacket(`${c}/split/${i}`, val));
        }

        // Todo: rename to 'namemap'
        // Map values to a hash, e.g. numbers to strings
        if (this.cmap[c].remap) {
            if (!Array.isArray(this.cmap[c].remap)) this.cmap[c].remap = [ this.cmap[c].remap ];
            for (let item in this.cmap[c].remap)
                packets.push(this.formPacket(`${c}/remap/${this.cmap[c].remap.id}`, this.cmap[c].remap.map[cval.toString()] || ''));
        }

        if (this.cmap[c].receiver)
            packets.push(this.formPacket(`${c}/r`, cval));

        return packets;
    }
}
