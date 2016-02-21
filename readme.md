# steamcmd [![Build Status](https://travis-ci.org/mathphreak/steamcmd.svg?branch=master)](https://travis-ci.org/mathphreak/steamcmd)

> My solid module


## Install

```
$ npm install --save steamcmd
```


## Usage

```js
const steamcmd = require('steamcmd');

steamcmd('unicorns');
//=> 'unicorns & rainbows'
```


## API

### steamcmd(input, [options])

#### input

Type: `string`

Lorem ipsum.

#### options

##### foo

Type: `boolean`<br>
Default: `false`

Lorem ipsum.


## CLI

```
$ npm install --global steamcmd
```

```
$ steamcmd --help

  Usage
    steamcmd [input]

  Options
    --foo  Lorem ipsum. [Default: false]

  Examples
    $ steamcmd
    unicorns & rainbows
    $ steamcmd ponies
    ponies & rainbows
```


## License

MIT © [Matt Horn](http://mathphreak.me)
