import {build,stop} from 'esbuild'
import {fileURLToPath} from 'node:url'
const root=fileURLToPath(new URL('../',import.meta.url))
const entries=['runtime','producer-worker','common','private-files','exact-sources']
const external=[...entries,'store','store-process'].map(name=>`./${name}.mjs`)
try{for(const name of entries){
 const result=await build({absWorkingDir:root,entryPoints:[`implementation/${name}.mts`],outfile:`src/${name}.mjs`,
  metafile:true,bundle:true,format:'esm',platform:'node',target:'es2023',packages:'external',
  external:external.filter(entry=>entry!==`./${name}.mjs`),
  banner:{js:'// Generated from canonical TypeScript; do not edit.'},logLevel:'warning',legalComments:'inline'})
 for(const output of Object.values(result.metafile.outputs))for(const dependency of output.imports){
  if(dependency.path.startsWith('.')&&!external.includes(dependency.path))throw new Error('Uncovered runtime helper')
 }
}}finally{stop()}
