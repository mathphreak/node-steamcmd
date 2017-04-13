/* eslint new-cap: [2, {"capIsNewExceptions": ["extractor.Extract"]}] */
'use strict'

var path = require('path')
var fs = require('fs')
var Promise = require('pinkie-promise')
var pty = require('node-pty')
var stripAnsi = require('strip-ansi')
var request = require('request')
var vdf = require('vdf')

var _ = {}
_.defaults = require('lodash.defaults')

var defaultOptions = {
  asyncDelay: 3000,
  binDir: path.join(__dirname, 'steamcmd_bin'),
  retries: 3,
  retryDelay: 3000
}

// Returns a promise that resolves after ms milliseconds
var promiseToWait = function (ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms)
  })
}

// Takes a func that returns a promise and a set of args to pass it.
// Returns the promise chained with retries and retry delays.
var promiseToRetry = function (func, args, opts) {
  opts = _.defaults(opts, defaultOptions)
  var result = func.apply(this, args)
  for (var i = 0; i < opts.retries; i++) {
    result = result.catch(function () {
      return promiseToWait(opts.retryDelay).then(function () {
        return func.apply(this, args)
      })
    })
  }

  return result
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

// Returns a Promise that runs the supplied SteamCMD commands.
// Resolves or rejects depending on exit code,
// passing an object containing the resulting stdout and exit code.
var run = function (commands, opts) {
  opts = _.defaults(opts, defaultOptions)
  var exeName
  var shellName
  var echoExitCode
  if (process.platform === 'win32') {
    exeName = 'steamcmd.exe'
    shellName = 'powershell.exe'
    echoExitCode = 'echo $lastexitcode'
  } else if (process.platform === 'darwin' || process.platform === 'linux') {
    exeName = 'steamcmd.sh'
    shellName = 'bash'
    echoExitCode = 'echo $?'
  } else {
    return Promise.reject('Unsupported platform')
  }
  var exePath = path.join(opts.binDir, exeName)
  commands = [exePath].concat(commands).concat(['quit', echoExitCode, 'exit'])

  return new Promise(function (resolve, reject) {
    var ptyProcess = pty.spawn(shellName, [], {
      cols: 120,
      rows: 30,
      cwd: process.env.HOME,
      env: process.env // @todo restrict env if possible, fails when empty
    })

    var stdout = ''
    ptyProcess.on('data', function (data) {
      stdout += stripAnsi(data)
    })

    ptyProcess.on('exit', function (code) {
      if (process.platform === 'win32') {
        // Exit code not available through event data on Windows
        // https://github.com/Tyriar/node-pty/issues/75
        code = stdout.substr(stdout.indexOf(echoExitCode)).match(/(-?\d+)/)[0]
        code = parseInt(code, 10)
      }
      var result = {code: code, stdout: stdout}
      if (code === 0 || code === 7) {
        // Steamcmd will occasionally exit with code 7 and be fine.
        // This usually happens the first run() after download().
        resolve(result)
      } else {
        reject(result)
      }
    })

    function processCommandChain() {
      if (commands.length > 0) {
        var command = commands.shift()
        if (command === 'wait') {
          // Waits for steam to complete asynchronous actions
          setTimeout(processCommandChain, opts.asyncDelay)
        } else {
          ptyProcess.write(command + '\r')
          // Wait a little while or steam won't accept the commands
          setTimeout(processCommandChain, 1000)
        }
      }
    }
    processCommandChain()
  })
}

var touch = function (opts) {
  opts = _.defaults(opts, defaultOptions)
  return run([], opts)
}

var getAppInfoOnce = function (appID, opts) {
  opts = _.defaults(opts, defaultOptions)
  var command = [
    'login anonymous',
    'app_info_request ' + appID,
    'wait',
    'app_info_print ' + appID
  ]
  return run(command, opts)
    .then(function (proc) {
      // strip Windows line endings
      var stdout = proc.stdout.replace('\r\n', '\n')
      // extract & parse info
      var infoTextStart = stdout.indexOf('"' + appID + '"')
      var infoTextEnd = stdout.indexOf('Steam>quit')
      if (infoTextStart === -1 || infoTextEnd === -1) {
        throw new TypeError('getAppInfo() failed to receive expected data.')
      }
      var infoText = stdout.substr(infoTextStart, infoTextEnd - infoTextStart)
      var result = vdf.parse(infoText)[appID]
      if (Object.keys(result).length === 0) {
        throw new TypeError('getAppInfo() received empty app data.')
      }
      return result
    })
}

var getAppInfo = function (appID, opts) {
  return promiseToRetry(getAppInfoOnce, [appID, opts], opts)
}

var updateAppOnce = function (appId, installDir, opts) {
  opts = _.defaults(opts, defaultOptions)
  if (!path.isAbsolute(installDir)) {
    // throw an error immediately because it's invalid data, not a failure
    throw new TypeError('installDir must be an absolute path in updateApp')
  }
  var commands = ['@ShutdownOnFailedCommand 0', 'login anonymous', 'force_install_dir ' + installDir, 'app_update ' + appId]
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

var updateApp = function (appId, installDir, opts) {
  return promiseToRetry(updateAppOnce, [appId, installDir, opts], opts)
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
