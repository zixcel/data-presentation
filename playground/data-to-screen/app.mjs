import { ClientProjectionRuntime, projectionIdentity, renderPlan } from '@zixcel/projection-client'
import { valueView } from '@zixcel/dom-renderer'
import samples from './samples.json'

const runtime = new ClientProjectionRuntime()
const first = samples[0].snapshot, second = samples[1].snapshot
runtime.adopt(first, { kind: 'hydrate', expected: projectionIdentity(first) })
runtime.present({ viewMode: 'structured' })
const originalAction = runtime.action('inspect')
const element = id => document.getElementById(id)
function display(message) {
  const plan = renderPlan(runtime.projection, runtime.presentation)
  element('source').textContent = JSON.stringify(runtime.projection.lineage, null, 2)
  element('snapshot').textContent = JSON.stringify(runtime.projection, null, 2)
  element('plan').textContent = JSON.stringify(plan, null, 2)
  element('rendered').replaceChildren(valueView(document, plan.regions[0].items[0].content.value))
  element('status').textContent = message
}
function rejection(operation) {
  const before = runtime.projection.revision
  try { operation(); display('Unexpected acceptance') }
  catch (error) {
    if (runtime.projection.revision !== before) throw new Error('Rejected operation changed adopted state')
    display(`Rejected: ${error.code}`)
  }
}
element('advance').addEventListener('click', () => {
  runtime.adopt(second, { kind: 'current', expectedCurrent: runtime.projection.revision })
  display('Adopted newer snapshot; synthetic counter is 2')
})
element('stale').addEventListener('click', () => {
  if (runtime.projection.revision === first.revision) {
    runtime.adopt(second, { kind: 'current', expectedCurrent: first.revision })
  }
  rejection(() => runtime.intent(originalAction))
})
element('mismatch').addEventListener('click', () => rejection(() =>
  runtime.adopt(first, { kind: 'hydrate', expected: projectionIdentity(second) })))
element('corrupt').addEventListener('click', () => rejection(() => {
  const invalid = structuredClone(second)
  invalid.data.items[0].value.count = 999
  runtime.adopt(invalid, { kind: 'current', expectedCurrent: runtime.projection.revision })
}))
window.addEventListener('pagehide', () => runtime.close(), { once: true })
display('Adopted initial snapshot; synthetic counter is 1')
