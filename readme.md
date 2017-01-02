# steamcmd

Call steamcmd from node.js

[![npm](https://img.shields.io/npm/dt/steamcmd.svg?style=flat-square)](https://www.npmjs.com/package/steamcmd)
[![AppVeyor](https://img.shields.io/appveyor/ci/mathphreak/node-steamcmd.svg?style=flat-square&label=Windows+build)](https://ci.appveyor.com/project/mathphreak/node-steamcmd)
[![Travis](https://img.shields.io/travis/mathphreak/node-steamcmd.svg?style=flat-square&label=OS+X+%2F+Linux+build)](https://travis-ci.org/mathphreak/node-steamcmd)

## Install

```
$ npm install --save steamcmd
```

## Usage

```js
const steamcmd = require('steamcmd');

steamcmd.download();
//=> returns a Promise for downloading steamcmd locally
steamcmd.touch();
//=> returns a Promise for ensuring that steamcmd is updated and dependencies exist
steamcmd.prep();
//=> returns a Promise for downloading and updating steamcmd
steamcmd.getAppInfo(730);
//=> returns a Promise for the app info of appID 730
```

## API

### steamcmd.download([opts])
Downloads steamcmd for the current OS into `opts.binDir`

### steamcmd.touch([opts])
Runs steamcmd and immediately exits

### steamcmd.prep([opts])
Downloads steamcmd and runs it

### steamcmd.getAppInfo(appid[, opts])
Asks steamcmd to get the app info for the given app

## Configuration

All functions take an optional options parameter.

#### binDir

type: string  
default: `path.join(__dirname, 'steamcmd_bin')`

The directory to use when downloading and running `steamcmd` itself.
Defaults to `steamcmd_bin` in the same directory where this package is installed.

## License

MIT © [Matt Horn](http://mathphreak.me)
