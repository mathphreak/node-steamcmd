import test from 'ava'
import steamcmd from './'
import fs from 'fs'
import tempfile from 'tempfile'
import mkdirp from 'mkdirp'
import path from 'path'
import del from 'del'

test('download', async (t) => {
  const binDirParent = tempfile('/')
  mkdirp.sync(binDirParent)
  const binDir = path.join(binDirParent, 'steamcmd_bin')
  await steamcmd.download({binDir})
  t.notThrows(() => {
    fs.statSync(binDir)
  })
  await del(binDirParent, {force: true})
})

test('touch', async (t) => {
  const binDirParent = tempfile('/')
  mkdirp.sync(binDirParent)
  const binDir = path.join(binDirParent, 'steamcmd_bin')
  const opts = {binDir}
  await steamcmd.download(opts)
  await steamcmd.touch(opts)
  t.notThrows(() => {
    fs.statSync(path.join(binDir, 'public'))
  })
  await del(binDirParent, {force: true})
})
