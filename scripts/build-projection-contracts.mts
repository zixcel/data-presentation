import {build,stop} from 'esbuild'
import {fileURLToPath} from 'node:url'
// Bundle internal typed modules into the established seven runtime files. This
// preserves the complete producer byte set covered by the worker artifact hash.
const root=fileURLToPath(new URL('../packages/projection-contracts/',import.meta.url))
const entries=['index','client','contract','producer','publication','hash-node','hash-browser']
try {for(const name of entries){
 const result=await build({absWorkingDir:root,entryPoints:[`implementation/${name}.mts`],outfile:`src/${name}.mjs`,
  metafile:true,bundle:true,format:'esm',platform:'neutral',target:'es2023',packages:'external',
  external:['#hash',...entries.filter(entry=>entry!==name).map(entry=>`./${entry}.mjs`)],
  banner:{js:'// Generated from canonical TypeScript; do not edit.'},logLevel:'warning',legalComments:'inline'})
 for(const output of Object.values(result.metafile.outputs))for(const dependency of output.imports){
  if(dependency.path.startsWith('.')&&!entries.some(entry=>dependency.path===`./${entry}.mjs`))throw new Error('Uncovered runtime module in producer artifact')
 }
}} finally {stop()}
