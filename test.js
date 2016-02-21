import test from 'ava'
import steamcmd from './'
import fs from 'fs'

test('download', async (t) => {
  await steamcmd.download()
  t.notThrows(() => {
    fs.statSync('steamcmd_bin')
  })
})
