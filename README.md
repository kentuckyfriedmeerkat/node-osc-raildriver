An interface between Train Simulator's API (`RailDriver.dll`) and the OSC protocol.
Includes personal/example TouchOSC layouts and control maps.

# Usage

`node index.js <controlmap>`

Remember to set up `config.json`! An example is included.

# Limitations

- Currently no support for OSC bundles
- Control maps can contain a lot of questionably-implemented
options, many of which are intended to get around limitations
in TouchOSC
- Basically no documentation
- No GUI

# Files
- `/index.js`: the main script
- `/controllers.js`: lists `RailDriver.dll` controllers for the
current loco
- `/oscUtil.js`: a small command shell-like utility for sending
and receiving OSC messages
- `/raildriver.js`: a JavaScript class that uses `node-ffi` to
interface with `RailDriver.dll`
- `/maps/`: example control maps
- `/touchosc/`: example TouchOSC layouts
