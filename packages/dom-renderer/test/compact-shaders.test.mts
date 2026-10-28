import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { compactThreeShaderSource } from '../tooling/compact-shaders.mjs'

test('compacts the exact installed Three shader chunks and rejects other input', async () => {
  const original = await readFile(new URL(import.meta.resolve('three')), 'utf8')
  const compacted = compactThreeShaderSource(original)
  assert.ok(compacted.length < original.length - 10_000)
  assert.throws(() => compactThreeShaderSource(original + ' '), /Unreviewed Three/)
  assert.match(compacted, /#pragma unroll_loop_start/)
  assert.match(compacted, /#include <common>/)
})
