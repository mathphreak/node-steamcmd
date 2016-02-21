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

### steamcmd.download()

## License

MIT © [Matt Horn](http://mathphreak.me)
