import test from 'node:test'
import assert from 'node:assert/strict'
import {hasUncheckedToken} from './typescript-source-guard.mts'
import { execFileSync } from 'node:child_process'
import {createHash} from 'node:crypto'
import {readFileSync,lstatSync,readdirSync} from 'node:fs'
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
  assert.ok(!hasUncheckedToken(source),file)
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

test('completed migration has a typed source for every generated runtime and no deferred JavaScript',()=>{
 assert.deepEqual(groups.pendingMigration,[]);assert.deepEqual(groups.pendingSha256,{})
 const files=new Set(tracked())
 function checkOrigins(outputs:readonly string[]){
  for(const output of outputs){
   assert.match(output,/^(?:packages\/[^/]+\/)?src\/[^/]+\.mjs$/)
   const source=output.replace('/src/','/implementation/').replace(/^src\//,'implementation/').replace(/\.mjs$/,'.mts')
   assert.ok(files.has(source),'No tracked canonical TypeScript for '+output)
  }
 }
 checkOrigins(groups.generated);assert.throws(()=>checkOrigins(['packages/dom-renderer/src/unowned-runtime.mjs']))
})
test('all emitted JavaScript is classified and all owner build configurations stay strict',()=>{
 const roots=['','packages/projection-contracts/','packages/projection-client/','packages/dom-renderer/','packages/view-contracts/','packages/view-server/']
 const outputs:string[]=[]
 for(const root of roots){
  const config=JSON.parse(readFileSync(root+'tsconfig.build.json','utf8')) as {compilerOptions:{strict?:boolean;noEmitOnError?:boolean;allowJs?:boolean}}
  assert.equal(config.compilerOptions.strict,true);assert.equal(config.compilerOptions.noEmitOnError,true);assert.notEqual(config.compilerOptions.allowJs,true)
  const files=readdirSync(root+'src',{withFileTypes:true});assert.ok(files.length<=4096)
  for(const file of files)if(/\.(?:mjs|cjs|js)$/.test(file.name)){assert.ok(file.isFile());outputs.push(root+'src/'+file.name)}
 }
 assert.deepEqual(outputs.sort(),[...groups.generated].sort(),'Build emitted unclassified or stale JavaScript')
})

test('source guard distinguishes unchecked types from legitimate DOM attribute text',()=>{
 for(const source of ['let value: any','const value = item as any','type Items = Promise<any>'])assert.equal(hasUncheckedToken(source),true)
 for(const source of ["input.step='any'",'const label="any"','// any is not a type here\nconst count:number=1'])assert.equal(hasUncheckedToken(source),false)
})
