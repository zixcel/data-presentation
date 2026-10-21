import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
const inventory: unknown = JSON.parse(readFileSync(new URL('../docs/typescript-migration.json', import.meta.url), 'utf8'))
assert.ok(inventory && typeof inventory === 'object' && 'generated' in inventory && 'pendingMigration' in inventory)
const groups = inventory as { generated: string[]; pendingMigration: string[] }
function check(paths: string[]): void {
 const javascript=paths.filter(p=>/\.(?:mjs|cjs|js)$/.test(p)).sort()
 assert.deepEqual(javascript,[...groups.generated,...groups.pendingMigration].sort(), 'Unclassified JavaScript or stale migration entry')
}
test('no unclassified JavaScript can be introduced during the tracked migration',()=>{
 const paths=execFileSync('git',['-c','core.fsmonitor=false','-c','core.hooksPath=/dev/null','ls-files','-z'],{encoding:'utf8',timeout:10000,maxBuffer:1048576}).split('\0').filter(Boolean)
 check(paths);assert.throws(()=>check([...paths,'src/untyped-new.mjs']))
})
test('migrated implementation and verifier use strict types without unchecked escapes',()=>{
 for(const file of ['packages/view-contracts/implementation/index.mts','packages/view-contracts/implementation/types.mts','scripts/verify-packed-consumer.mts']){
  const source=readFileSync(file,'utf8');assert.ok(!/@ts-(?:nocheck|ignore)/.test(source))
  assert.ok(!/\bany\b/.test(source),file)
 }
})
