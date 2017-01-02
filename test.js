import fs from 'fs'
import path from 'path'
import tempfile from 'tempfile'
import mkdirp from 'mkdirp'
import test from 'ava'
import del from 'del'
import steamcmd from './'

test.before(() => {
  mkdirp.sync('test_data')
})

test.after.always(() => {
  return del('test_data')
})

test.beforeEach(t => {
  const binDirParent = tempfile('/')
  mkdirp.sync(binDirParent)
  const binDir = path.join(binDirParent, 'steamcmd_bin')
  const opts = {binDir}
  t.context = {binDirParent, binDir, opts}
})

test.afterEach(async t => {
  await del(t.context.binDirParent, {force: true})
})

test('download', async t => {
  var {binDir, opts} = t.context
  await steamcmd.download(opts)
  t.notThrows(() => {
    fs.statSync(binDir)
  })
})

test('touch', async t => {
  var {binDir, opts} = t.context
  await steamcmd.download(opts)
  // fix random EBUSY on Windows
  await new Promise(resolve => setTimeout(resolve, 200))
  await steamcmd.touch(opts)
  t.notThrows(() => {
    fs.statSync(path.join(binDir, 'public'))
  })
})

test('prep', async t => {
  var {binDir, opts} = t.context
  await steamcmd.prep(opts)
  t.notThrows(() => fs.statSync(path.join(binDir, 'public')))
})

test('getAppInfo', async t => {
  var {opts} = t.context
  await steamcmd.download(opts)
  // fix random EBUSY on Windows
  await new Promise(resolve => setTimeout(resolve, 200))
  await steamcmd.touch(opts)
  const csgoAppInfo = await steamcmd.getAppInfo(730, opts)
  t.is(csgoAppInfo.common.name, 'Counter-Strike: Global Offensive')
})

test('repeated calls to getAppInfo', async t => {
  var {opts} = t.context
  await steamcmd.download(opts)
  // fix random EBUSY on Windows
  await new Promise(resolve => setTimeout(resolve, 200))
  await steamcmd.touch(opts)
  const csgoAppInfo = await steamcmd.getAppInfo(730, opts)
  t.is(csgoAppInfo.common.name, 'Counter-Strike: Global Offensive')
  t.notThrows(steamcmd.getAppInfo(730, opts))
})

test('updateApp with a relative path', async t => {
  var {opts} = t.context
  await steamcmd.download(opts)
  // fix random EBUSY on Windows
  await new Promise(resolve => setTimeout(resolve, 200))
  await steamcmd.touch(opts)
  t.throws(() => steamcmd.updateApp(1007, 'bad_steamworks', opts))
  t.throws(() => fs.statSync('bad_steamworks'))
})

test.only('updateApp with a nonexistent app', async t => {
  var {opts} = t.context
  await steamcmd.download(opts)
  // fix random EBUSY on Windows
  await new Promise(resolve => setTimeout(resolve, 200))
  await steamcmd.touch(opts)
  t.throws(steamcmd.updateApp(4, path.resolve('test_data', 'nonexistent_app'), opts))
  // fix random failure on Windows
  await new Promise(resolve => setTimeout(resolve, 200))
  console.log('test_data', fs.readdirSync('test_data'))
  console.log('nonexistent_app', fs.readdirSync(path.resolve('test_data', 'nonexistent_app')))
  console.log('steamapps', fs.readdirSync(path.resolve('test_data', 'nonexistent_app', 'steamapps')))
  t.notThrows(() => fs.statSync(path.resolve('test_data', 'nonexistent_app', 'steamapps', 'libraryfolders.vdf')))
  await new Promise(resolve => setTimeout(resolve, 200))
})

test('updateApp with valid parameters', async t => {
  var {opts} = t.context
  await steamcmd.download(opts)
  // fix random EBUSY on Windows
  await new Promise(resolve => setTimeout(resolve, 500))
  await steamcmd.touch(opts)
  t.true(await steamcmd.updateApp(1007, path.resolve('test_data', 'steamworks'), opts))
})

test('updateApp with HLDS workaround', async t => {
  var {opts} = t.context
  await steamcmd.download(opts)
  // fix random EBUSY on Windows
  await new Promise(resolve => setTimeout(resolve, 500))
  await steamcmd.touch(opts)
  t.true(await steamcmd.updateApp(90, path.resolve('test_data', 'hlds'), opts))
})
