let closest = (num, arr) => {
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

let formatValue = (c, val, format) => {
    let _form = format || _cmap[c].format || null;
    if (_form === null) return val;
    let cval = Numbro(val).format(_form);
    debugger;
    return cval;
};

let filterValue = (c, rval) => {
    if (_cmap[c].maskneg && rval < 0) return '';
    return formatValue(c, rval);
};

let formPacket = (c, cval) => {
    return {
        address: `/control/${c}`,
        args: [{
            type: 's',
            value: cval
        }]
    };
};

let postmap = (c, rval, cval) => {
    let packets = [];

    // Duplicate values with different formats
    if (_cmap[c].dupl) {
        if (!Array.isArray(_cmap[c].dupl)) _cmap[c].dupl = [_cmap[c].dupl];
        for (let i in _cmap[c].dupl)
            packets.push(formPacket(`${c}/dupl/${i}`, formatValue(c, cval, _cmap[c].dupl[i])));
    }

    if (_cmap[c].outsplit) for (let i in _cmap[c].outsplit) {
        let x = _cmap[c].outsplit;
        let val = null;
        if (typeof x[i] == 'number') val = cval == x[i]? 1 : 0;
        else if (Array.isArray(x[i])) val = x[i].includes(cval)? 1 : 0;
        packets.push(formPacket(`${c}/split/${i}`, val));
    }

    // Todo: rename to 'namemap'
    // Map values to a hash, e.g. numbers to strings
    if (_cmap[c].remap) {
        if (!Array.isArray(_cmap[c].remap)) _cmap[c].remap = [ _cmap[c].remap ];
        for (let item in _cmap[c].remap)
            packets.push(formPacket(`${c}/remap/${_cmap[c].remap.id}`, _cmap[c].remap.map[cval.toString()] || ''));
    }

    if (_cmap[c].receiver)
        packets.push(formPacket(`${c}/r`, cval));

    return packets;
};

module.exports = {
    formatValue,
    filterValue,
    formPacket,
    postmap,
    closest
};
