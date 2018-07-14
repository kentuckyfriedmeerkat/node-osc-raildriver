let ffi = require('ffi');
let ref = require('ref');

module.exports = class RailDriver {
    constructor(dll) {
        console.log(`Connecting to DLL at ${dll}...`);
        this._lib = ffi.Library(dll, {
            SetRailSimConnected: ['void', ['bool']],
            SetRailDriverConnected: ['void', ['bool']],
            GetLocoName: ['string', []],
            GetControllerList: ['string', []],
            GetControllerValue: ['float', ['int', 'int']],
            SetControllerValue: ['void', ['int', 'float']]
        });
        
        this._lastLoco = '';
        this._controllers = {};
        this._connected = false;

        this.Loco = class {
            constructor(vendor, pack, model) {
                this.Vendor = vendor;
                this.Pack = pack;
                this.Model = model;
            }
        };

        this.VirtualController = {
            Latitude: 400,
            Longitude: 401,
            FuelLevel: 402,
            InTunnel: 403,
            Gradient: 404,
            Heading: 405,
            TimeHours: 406,
            TimeMins: 407,
            TimeSecs: 408
        }
    }

    Connect() {
        if (this._connected) return;
        console.log('Connecting RailDriver interface...');
        this._lib.SetRailSimConnected(true);
        this._lib.SetRailDriverConnected(true);
        this._connected = true;
        this.UpdateControllerList();
        this.uclInterval = setInterval(this.UpdateControllerList, 2000);
    }

    Disconnect() {
        if (!this._connected) return;
        clearTimeout(this.uclInterval);
        this._lib.SetRailDriverConnected(false);
        this._lib.SetRailSimConnected(false);
        this._connected = false;
    }

    GetLocoName() {
        if (!this._connected) return;
        this._lastLoco = this._lib.GetLocoName();
        let a = this._lastLoco.split('.:.');
        return new this.Loco(a[0], a[1], a[2]);
    }

    get HasLocoChanged() {
        if (!this._connected) return false;
        console.log(`Loco changed!`);
        return this._lastLoco != this._lib.GetLocoName();
    }

    UpdateControllerList() {
        if (!this._connected) return;
        console.log('Updating controller list...');
        let cl = this._lib.GetControllerList().split('::');
        this._controllers = {};
        for (let i in cl) this._controllers[cl[i]] = i;
    }

    GetControllerValue(controllerName) {
        if (!this._connected) return;
        if (!this._controllers[controllerName]) return;
        return this._lib.GetControllerValue(this._controllers[controllerName], 0);
    }

    GetControllerMin(controllerName) {
        if (!this._connected) return;
        if (!this._controllers[controllerName]) return;
        return this._lib.GetControllerValue(this._controllers[controllerName], 1);
    }

    GetControllerMax(controllerName) {
        if (!this._connected) return;
        if (!this._controllers[controllerName]) return;
        return this._lib.GetControllerValue(this._controllers[controllerName], 2);
    }

    SetControllerValue(controllerName, value) {
        if (!this._connected) return;
        if (!this._controllers[controllerName]) return;
        this._lib.SetControllerValue(this._controllers[controllerName], value);
    }

    get Controllers() {
        if (!this._connected) this._controllers = {};
        return this._controllers;
    }

    get Connected() {
        return this._connected;
    }
}