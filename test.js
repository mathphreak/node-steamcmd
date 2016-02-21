import test from 'ava'
import steamcmd from './'
import fs from 'fs'
import tempfile from 'tempfile'
import mkdirp from 'mkdirp'
import path from 'path'
import del from 'del'

test.beforeEach((t) => {
  const binDirParent = tempfile('/')
  mkdirp.sync(binDirParent)
  const binDir = path.join(binDirParent, 'steamcmd_bin')
  const opts = {binDir}
  t.context = {binDirParent, binDir, opts}
})

test.afterEach(async (t) => {
  await del(t.context.binDirParent, {force: true})
})

test('download', async (t) => {
  var {binDir, opts} = t.context
  await steamcmd.download(opts)
  t.notThrows(() => {
    fs.statSync(binDir)
  })
})

test('touch', async (t) => {
  var {binDir, opts} = t.context
  await steamcmd.download(opts)
  // fix random EBUSY on Windows
  await new Promise((resolve) => setTimeout(resolve, 200))
  await steamcmd.touch(opts)
  t.notThrows(() => {
    fs.statSync(path.join(binDir, 'public'))
  })
})

test.only('getAppInfo', async (t) => {
  var {opts} = t.context
  await steamcmd.download(opts)
  // fix random EBUSY on Windows
  await new Promise((resolve) => setTimeout(resolve, 200))
  await steamcmd.touch(opts)
  const csgoAppInfo = await steamcmd.getAppInfo(730, opts)
  console.log(csgoAppInfo)
  t.is(csgoAppInfo.common.name, 'Counter-Strike: Global Offensive')
})
