# steamcmd [![Build Status](https://travis-ci.org/mathphreak/node-steamcmd.svg?branch=master)](https://travis-ci.org/mathphreak/node-steamcmd)

> My solid module

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
```

## API

### steamcmd.download([opts])
Downloads steamcmd for the current OS into `opts.binDir`

### steamcmd.touch([opts])
Runs steamcmd from `opts.binDir` and then exits

## Configuration

All functions take an optional options parameter.

#### binDir

type: string  
default: `path.join(__dirname, 'steamcmd_bin')`

The directory to use when downloading and running `steamcmd` itself.
Defaults to `steamcmd_bin` in the same directory where this package is installed.

## License

MIT © [Matt Horn](http://mathphreak.me)
