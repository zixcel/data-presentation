import assert from 'node:assert/strict'
import { sampleSnapshots } from '../examples/data-to-screen.mts'
import { ClientProjectionRuntime, projectionIdentity, renderPlan } from '@zixcel/projection-client'
import { valueView, renderBounds } from '@zixcel/dom-renderer'
const [first, second] = await sampleSnapshots()
assert.notEqual(first.snapshot.revision, second.snapshot.revision)
const client = new ClientProjectionRuntime()
try {
  client.adopt(first.snapshot, { kind: 'hydrate', expected: projectionIdentity(first.snapshot) })
  const action = client.action('inspect')
  client.adopt(second.snapshot, { kind: 'current', expectedCurrent: first.snapshot.revision })
  assert.ok(client.projection)
  const content=renderPlan(client.projection, client.presentation).regions[0].items[0].content
  assert.ok('value' in content)
  const counter=content.value
  assert.ok(counter&&typeof counter==='object'&&!Array.isArray(counter)&&'count' in counter)
  assert.equal(counter.count,2)
  assert.throws(() => client.intent(action), error => error instanceof Error && 'code' in error && error.code === 'StaleSceneAction')
  assert.throws(() => client.adopt(first.snapshot, { kind: 'hydrate', expected: projectionIdentity(second.snapshot) }),
    error => error instanceof Error && 'code' in error && error.code === 'HydrationProjectionMismatch')
  assert.equal(client.projection.revision, second.snapshot.revision)
  assert.equal(typeof valueView, 'function')
  assert.ok(renderBounds.nodes > 0)
} finally { client.close() }
