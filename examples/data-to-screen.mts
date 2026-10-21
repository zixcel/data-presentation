import type {SourceReader} from '@zixcel/projection-runtime'
import type {ExactSource} from '@zixcel/projection-contracts'
import assert from 'node:assert/strict'
import { chmodSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { scene } from '@zixcel/projection-contracts'
import { ProducerRegistry, ProjectionRuntime } from '@zixcel/projection-runtime'
import { FileProjectionStore } from '@zixcel/projection-runtime/store'

export async function sampleSnapshots() {
  const parent = mkdtempSync(join(tmpdir(), 'projection-example-'))
  chmodSync(parent, 0o700)
  const store = FileProjectionStore.create(join(parent, 'snapshots'))
  const registry = new ProducerRegistry()
  const producer = registry.register({ id: 'synthetic-data', kind: 'data' })
  let source:ExactSource
  const reader:SourceReader = {
    async acquireExact(refs, { accessRef, holder }) {
      assert.equal(accessRef, 'synthetic-owner-access')
      assert.deepEqual(refs, [source.source])
      return { sources: [source], leaseRefs: [holder] }
    },
    async release() {},
  }
  const runtime = new ProjectionRuntime({ store, registry, reader })
  const results = []
  try {
    for (const count of [1, 2]) {
      const ref = { owner: 'playground', ref: 'synthetic-state', revision: `revision-${count}`, kind: 'fixture' }
      source = { source: ref, items: [{ id: 'counter', semanticRef: null,
        group: { kind: 'structural', ref: 'synthetic-group' }, value: { label: 'Synthetic counter', count },
        evidence: ['synthetic-evidence'], provenance: ['synthetic-source'], resolutionRefs: [], visibility: 'visible' }],
        relations: [], unresolved: [], truncated: false }
      const result = await runtime.submit({ key: 'demo-data', producer, sources: [ref],
        focus: 'counter', purpose: 'demonstration', visibilityRef: 'synthetic-owner-visible', limits: {} },
      { accessRef: 'synthetic-owner-access', id: `sample-${count}` })
      assert.deepEqual(store.read('demo-data'), result.snapshot)
      assert.ok(result.snapshot.kind==='Data')
      const view = scene(result.snapshot, { key: 'demo-scene', focus: 'counter', purpose: 'demonstration',
        regions: [{ id: 'main', role: 'Primary', itemIds: ['counter'] }],
        actions: [{ id: 'inspect', targetOwner: 'playground', commandRef: 'synthetic-inspect',
          contextRefs: ['counter'], sourceRefs: [ref], label: 'Inspect synthetic state' }] })
      results.push({ snapshot: view, publication: result.receipt })
    }
    return results
  } finally {
    await runtime.close()
    rmSync(parent, { recursive: true, force: true })
  }
}
