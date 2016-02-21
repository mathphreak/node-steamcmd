/* eslint new-cap: [2, {"capIsNewExceptions": ["extractor.Extract"]}] */
'use strict'

var path = require('path')
var request = require('request')

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
    request(url)
      .on('end', resolve)
      .on('error', reject)
      .pipe(extractor.Extract({path: path.join(__dirname, 'steamcmd_bin')}))
  })
}

module.exports = {}

module.exports.download = download
