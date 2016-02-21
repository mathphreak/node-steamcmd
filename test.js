import test from 'ava'
import steamcmd from './'
import fs from 'fs'

test('download', async (t) => {
  await steamcmd.download()
  t.notThrows(() => {
    fs.statSync('steamcmd_bin')
  })
})

test('touch', async (t) => {
  await steamcmd.download()
  await steamcmd.touch()
  t.notThrows(() => {
    fs.statSync('steamcmd_bin/appcache')
  })
})
