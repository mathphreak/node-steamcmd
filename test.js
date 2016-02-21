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
  await steamcmd.touch(opts)
  t.notThrows(() => {
    fs.statSync(path.join(binDir, 'public'))
  })
})
