An interface between Train Simulator's API (`RailDriver.dll`) and the OSC protocol.
Includes personal TouchOSC and control map templates.

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
