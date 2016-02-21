/* eslint new-cap: [2, {"capIsNewExceptions": ["extractor.Extract"]}] */
'use strict'

var Promise = require('pinkie-promise')
var path = require('path')
var request = require('request')
var child = require('child-process-promise')
var fs = require('fs')
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
  } catch (e) {
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

module.exports = {}

module.exports.download = downloadIfNeeded
module.exports.touch = touch
