# steamcmd

Call SteamCMD from Node.js

[![npm](https://img.shields.io/npm/dt/steamcmd.svg?style=flat-square)](https://www.npmjs.com/package/steamcmd)
[![AppVeyor](https://img.shields.io/appveyor/ci/mathphreak/node-steamcmd.svg?style=flat-square&label=Windows+build)](https://ci.appveyor.com/project/mathphreak/node-steamcmd)
[![Travis](https://img.shields.io/travis/mathphreak/node-steamcmd.svg?style=flat-square&label=OS+X+%2F+Linux+build)](https://travis-ci.org/mathphreak/node-steamcmd)

## Install

```
$ npm install --save steamcmd
```

SteamCMD works faster if all its [required ports](https://support.steampowered.com/kb_article.php?ref=8571-GLVN-8711)
are available:
* UDP 27015 through 27030
* TCP 27015 through 27030

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
steamcmd.updateApp(90, path.resolve('hlds'));
//=> returns a Promise for installing/updating the Half-Life Dedicated Server into 'hlds'
```

## API

### steamcmd.download([opts])
Downloads SteamCMD for the current OS into `opts.binDir`
unless `opts.binDir` already exists and is accessible.

### steamcmd.touch([opts])
Ensures SteamCMD is usable by running it with no arguments and exiting.

### steamcmd.prep([opts])
Runs `download([opts])`, waits briefly to avoid `EBUSY`, then runs
`touch([opts])`.

### steamcmd.getAppInfo(appid[, opts])
Asks SteamCMD to get the latest app info for the given app.

### steamcmd.updateApp(appid, installDir[, opts])
Asks SteamCMD to install/update the given app to the given **absolute**
directory. Throws a `TypeError` if `installDir` is not absolute.
Returns `true` if the update succeeded or `false` if it wasn't required.
If SteamCMD's stdout isn't recognized, throws it as an error.

## Configuration

All functions take an optional options parameter.

#### asyncDelay

type: int
default: `3000`

The number of milliseconds to wait for steam to complete asynchronous tasks
before closing the terminal. Not waiting long enough can cause it to fail to
store the results of requests.

#### binDir

type: string
default: `path.join(__dirname, 'steamcmd_bin')`

The directory to use when downloading and running `steamcmd` itself.
Defaults to `steamcmd_bin` in the same directory where this package is installed.

#### retries

type: int
default: `3`

The number of times to re-attempt commands that are known to occasionally fail
due to issues with SteamCMD. `3` should be sufficient for most purposes, but
certain apps occasionally require additional attempts (HLDS, Rust).

#### retryDelay

type: int
default: `3000`

The number of milliseconds to wait between re-attempt commands. Retrying too
quickly can cause Steam's `memstd.cpp` to emit out of memory errors.

## Testing

The tests run in parallel and do a significant amount of downloading and IO.
If you're running programs that scan downloaded files, like anti-virus or
anti-malware (e.g. Windows Defender Realtime Protection), the test processes
may run very slowly or be blocked with `EBUSY`. Try temporarily disabling such
programs while running the tests.

## License

MIT © [Matt Horn](http://www.matthorn.tech)
