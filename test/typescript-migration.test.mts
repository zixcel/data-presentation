import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import {createHash} from 'node:crypto'
import {readFileSync,lstatSync} from 'node:fs'
const inventory: unknown = JSON.parse(readFileSync(new URL('../docs/typescript-migration.json', import.meta.url), 'utf8'))
assert.ok(inventory && typeof inventory === 'object' && 'generated' in inventory && 'pendingMigration' in inventory)
const groups = inventory as { generated: string[]; pendingMigration: string[];pendingSha256: Record<string,string> }
function tracked(): string[]{return execFileSync('git',['-c','core.fsmonitor=false','-c','core.hooksPath=/dev/null','ls-files','-z'],{encoding:'utf8',timeout:10000,maxBuffer:1048576}).split('\0').filter(Boolean)}
function check(paths: string[]): void {
 const javascript=paths.filter(p=>/\.(?:mjs|cjs|js)$/.test(p)).sort()
 assert.deepEqual(javascript,[...groups.generated,...groups.pendingMigration].sort(), 'Unclassified JavaScript or stale migration entry')
}
test('no unclassified JavaScript can be introduced during the tracked migration',()=>{
 const paths=tracked()
 check(paths);assert.throws(()=>check([...paths,'src/untyped-new.mjs']))
})
test('migrated implementation and verifier use strict types without unchecked escapes',()=>{
 for(const file of tracked().filter(name=>/^(?:packages\/[^/]+\/)?implementation\/.*\.mts$|^scripts\/.*\.mts$/.test(name))){
  const source=readFileSync(file,'utf8');assert.ok(!/@ts-(?:nocheck|ignore)/.test(source))
  assert.ok(!/\bany\b/.test(source),file)
 }
})

test('remaining JavaScript cannot be edited in place instead of migrated to TypeScript',()=>{
 assert.deepEqual(Object.keys(groups.pendingSha256).sort(),[...groups.pendingMigration].sort())
 for(const name of groups.pendingMigration){
  const info=lstatSync(name);assert.ok(info.isFile()&&!info.isSymbolicLink()&&info.size<=524288)
  assert.match(groups.pendingSha256[name],/^[a-f0-9]{64}$/)
  assert.equal(createHash('sha256').update(readFileSync(name)).digest('hex'),groups.pendingSha256[name],`Migrate ${name} before editing it`)
 }
})
