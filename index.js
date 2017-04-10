/* eslint new-cap: [2, {"capIsNewExceptions": ["extractor.Extract"]}] */
'use strict'

var path = require('path')
var fs = require('fs')
var Promise = require('pinkie-promise')
var request = require('request')
var child = require('child-process-promise')
var vdf = require('vdf')

var _ = {}
_.defaults = require('lodash.defaults')

var defaultOptions = {
  binDir: path.join(__dirname, 'steamcmd_bin')
}

var download = function (opts) {
  opts = _.defaults(opts, defaultOptions)
  var url
  var extractor
  if (process.platform === 'win32') {
    url = 'https://steamcdn-a.akamaihd.net/client/installer/steamcmd.zip'
    extractor = require('unzip')
  } else if (process.platform === 'darwin') {
    url = 'https://steamcdn-a.akamaihd.net/client/installer/steamcmd_osx.tar.gz'
    extractor = require('tar')
  } else if (process.platform === 'linux') {
    url = 'https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz'
    extractor = require('tar')
  } else {
    return Promise.reject('Unsupported platform')
  }
  return new Promise(function (resolve, reject) {
    var req = request(url)
    if (process.platform !== 'win32') {
      req = req.pipe(require('zlib').createGunzip())
    }
    req.pipe(extractor.Extract({path: opts.binDir})
      .on('finish', resolve)
      .on('error', reject)
    )
  })
}

var downloadIfNeeded = function (opts) {
  opts = _.defaults(opts, defaultOptions)
  try {
    fs.statSync(opts.binDir)
    return Promise.resolve()
  } catch (err) {
    return download(opts)
  }
}

var run = function (commands, opts) {
  opts = _.defaults(opts, defaultOptions)
  var exeName
  if (process.platform === 'win32') {
    exeName = 'steamcmd.exe'
  } else if (process.platform === 'darwin') {
    exeName = 'steamcmd.sh'
  } else if (process.platform === 'linux') {
    exeName = 'steamcmd.sh'
  } else {
    return Promise.reject('Unsupported platform')
  }
  var args = commands.concat('quit').map(function (x) {
    return '+' + x
  }).join(' ').split(' ')
  return new Promise(function (resolve, reject) {
    child.spawn(path.join(opts.binDir, exeName),
      args,
      {
        capture: ['stdout', 'stderr'],
        cwd: opts.binDir
      }
    ).then(function (x) {
      resolve(x)
    }).fail(function (x) {
      // For some reason, steamcmd will occasionally exit with code 7 and be fine.
      // This usually happens the first time touch() is called after download().
      if (x.code === 7) {
        resolve(x)
      } else {
        reject(x)
      }
    })
  })
}

var touch = function (opts) {
  opts = _.defaults(opts, defaultOptions)
  return run([], opts)
}

var getAppInfo = function (appID, opts) {
  opts = _.defaults(opts, defaultOptions)

  // The first call to app_info_print from a new install will return nothing,
  // and it will instead prep an entry for the info and request it.
  // It won't block though, and if the session closes before it can save,
  // the same issue will be present on next run.
  // Thus we use `app_update` to force the session to wait long enough to save.
  var forceInfoCommand = [
    '@ShutdownOnFailedCommand 0', 'login anonymous',
    'app_info_print ' + appID,
    'force_install_dir ./4', 'app_update 4'
  ]

  // The output from app_update can collide with that of app_info_print,
  // so after ensuring the info is available we must re-run without app_update.
  var fetchInfoCommand = [
    '@ShutdownOnFailedCommand 0', 'login anonymous',
    'app_info_update 1', // force data update
    'app_info_print ' + appID,
    'find e' // fill the buffer so info's not truncated on Windows
  ]

  return run(forceInfoCommand, opts) // @todo only force when needed
    .then(function () {
      return run(fetchInfoCommand, opts)
    })
    .then(function (proc) {
      // strip Windows line endings
      var stdout = proc.stdout.replace('\r\n', '\n')
      // extract & parse info
      var infoTextStart = stdout.indexOf('"' + appID + '"')
      var infoTextEnd = stdout.indexOf('ConVars:')
      var infoText = stdout.substr(infoTextStart, infoTextEnd - infoTextStart)
      return vdf.parse(infoText)[appID]
    })
}

var updateApp = function (appId, installDir, opts) {
  opts = _.defaults(opts, defaultOptions)
  if (!path.isAbsolute(installDir)) {
    // throw an error immediately because it's invalid data, not a failure
    throw new TypeError('installDir must be an absolute path in updateApp')
  }
  var commands = ['@ShutdownOnFailedCommand 0', 'login anonymous', 'force_install_dir ' + installDir, 'app_update ' + appId]
  if (parseInt(appId, 10) === 90) {
    commands = commands.concat('app_update ' + appId)
  }
  return run(commands, opts)
    .then(function (proc) {
      if (proc.stdout.indexOf('Success! App \'' + appId + '\' fully installed') !== -1) {
        return true
      }
      if (proc.stdout.indexOf('Success! App \'' + appId + '\' already up to date.') !== -1) {
        return false
      }

      var stdoutArray = proc.stdout.replace('\r\n', '\n').split('\n')
      return Promise.reject(new Error('Unable to update ' + appId + '. \n SteamCMD error was ' + stdoutArray[stdoutArray.length - 2]))
    })
}

var prep = function (opts) {
  opts = _.defaults(opts, defaultOptions)
  return downloadIfNeeded(opts)
    .then(function () {
      return new Promise(function (resolve) {
        setTimeout(resolve, 500)
      })
    })
    .then(function () {
      return touch(opts)
    })
}

module.exports = {}

module.exports.download = downloadIfNeeded
module.exports.touch = touch
module.exports.prep = prep
module.exports.getAppInfo = getAppInfo
module.exports.updateApp = updateApp
