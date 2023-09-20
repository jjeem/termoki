# Termoki
A terminal emulator built with web tech (Electronjs and TypeScript)


## Installation
Go to [releases](https://github.com/jjeem/termoki/releases)

## Note for setting up development environment
After postinstall script, node-pty is being built for wrong NODE_MODULE_VERSION=116

So you may need to re-run `electron-rebuild` whenever there is a change to your `node_modules`:

```sh
$(npm bin)/electron-rebuild
```

Or if you're on **Windows**:

```sh
.\node_modules\.bin\electron-rebuild.cmd
```

Reference [issue](https://stackoverflow.com/questions/46384591/node-was-compiled-against-a-different-node-js-version-using-node-module-versio/52796884#52796884)
