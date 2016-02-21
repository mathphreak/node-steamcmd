/* eslint new-cap: [2, {"capIsNewExceptions": ["extractor.Extract"]}] */
'use strict'

var Promise = require('pinkie-promise')
var path = require('path')
var request = require('request')
var child = require('child-process-promise')
var fs = require('fs')

var binDir = path.join(__dirname, 'steamcmd_bin')

var download = function () {
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
      .on('end', resolve)
      .on('error', reject)
    if (process.platform !== 'win32') {
      req = req.pipe(require('zlib').createGunzip())
    }
    req.pipe(extractor.Extract({path: binDir}))
  })
}

var downloadIfNeeded = function () {
  try {
    fs.statSync(binDir)
    return Promise.resolve()
  } catch (e) {
    return download()
  }
}

var run = function (commands) {
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
  return child.spawn(path.join(binDir, exeName),
    args,
    {cwd: binDir}
  )
}

var touch = function () {
  return run([])
}

module.exports = {}

module.exports.download = downloadIfNeeded
module.exports.touch = touch
