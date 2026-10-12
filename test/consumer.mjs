import assert from 'node:assert/strict'
import { sampleSnapshots } from './example.mjs'
import { ClientProjectionRuntime, projectionIdentity, renderPlan } from '@zixcel/projection-client'
import { valueView, renderBounds } from '@zixcel/dom-renderer'
const [first, second] = await sampleSnapshots()
assert.notEqual(first.snapshot.revision, second.snapshot.revision)
const client = new ClientProjectionRuntime()
try {
  client.adopt(first.snapshot, { kind: 'hydrate', expected: projectionIdentity(first.snapshot) })
  const action = client.action('inspect')
  client.adopt(second.snapshot, { kind: 'current', expectedCurrent: first.snapshot.revision })
  assert.equal(renderPlan(client.projection, client.presentation).regions[0].items[0].content.value.count, 2)
  assert.throws(() => client.intent(action), error => error.code === 'StaleSceneAction')
  assert.throws(() => client.adopt(first.snapshot, { kind: 'hydrate', expected: projectionIdentity(second.snapshot) }),
    error => error.code === 'HydrationProjectionMismatch')
  assert.equal(client.projection.revision, second.snapshot.revision)
  assert.equal(typeof valueView, 'function')
  assert.ok(renderBounds.nodes > 0)
} finally { client.close() }
