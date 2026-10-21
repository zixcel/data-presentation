import { ClientProjectionRuntime, projectionIdentity, renderPlan } from '@zixcel/projection-client'
import { valueView } from '@zixcel/dom-renderer'
import samples from './samples.json' with {type:'json'}
import {validateSnapshot} from '@zixcel/projection-contracts/client'

const runtime = new ClientProjectionRuntime()
function sceneSample(value:unknown){const snapshot=validateSnapshot(value);if(snapshot.kind!=='Scene')throw Error('Expected Scene sample');return snapshot}
const first = sceneSample(samples[0].snapshot), second = sceneSample(samples[1].snapshot)
runtime.adopt(first, { kind: 'hydrate', expected: projectionIdentity(first) })
runtime.present({ viewMode: 'structured' })
function current(){const value=runtime.projection;if(!value)throw Error('Projection not adopted');return value}
const originalAction = runtime.action('inspect')
const element = (id:string):HTMLElement => {const node=document.getElementById(id);if(!node)throw Error('Missing playground element');return node}
function display(message:string) {
  const plan = renderPlan(current(), runtime.presentation)
  element('source').textContent = JSON.stringify(current().lineage, null, 2)
  element('snapshot').textContent = JSON.stringify(current(), null, 2)
  element('plan').textContent = JSON.stringify(plan, null, 2)
  const content=plan.regions[0].items[0].content
  if(!('value' in content))throw Error('Missing sample content')
  element('rendered').replaceChildren(valueView(document,content.value))
  element('status').textContent = message
}
function rejection(operation:()=>unknown) {
  const before = current().revision
  try { operation(); display('Unexpected acceptance') }
  catch (error) {
    if (current().revision !== before) throw new Error('Rejected operation changed adopted state')
    display(`Rejected: ${error instanceof Error&&'code' in error?String(error.code):'UnknownFailure'}`)
  }
}
element('advance').addEventListener('click', () => {
  runtime.adopt(second, { kind: 'current', expectedCurrent: current().revision })
  display('Adopted newer snapshot; synthetic counter is 2')
})
element('stale').addEventListener('click', () => {
  if (current().revision === first.revision) {
    runtime.adopt(second, { kind: 'current', expectedCurrent: first.revision })
  }
  rejection(() => runtime.intent(originalAction))
})
element('mismatch').addEventListener('click', () => rejection(() =>
  runtime.adopt(first, { kind: 'hydrate', expected: projectionIdentity(second) })))
element('corrupt').addEventListener('click', () => rejection(() => {
  const invalid = structuredClone(second)
  const data=invalid.data.items[0].value
  if(!data||typeof data!=='object'||Array.isArray(data))throw Error('Invalid sample value')
  // Intentional corruption creates a new value while retaining the old revision.
  Object.assign(data,{count:999})
  runtime.adopt(invalid, { kind: 'current', expectedCurrent: current().revision })
}))
window.addEventListener('pagehide', () => runtime.close(), { once: true })
display('Adopted initial snapshot; synthetic counter is 1')
