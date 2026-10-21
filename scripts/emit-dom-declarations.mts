import {copyFileSync,mkdirSync,readdirSync,rmSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
// Keep emitted declarations separate from existing public input declarations.
const root=fileURLToPath(new URL('../packages/dom-renderer/',import.meta.url))
const temporary=root+'build/types'
try{
 mkdirSync(root+'src',{recursive:true})
 for(const name of readdirSync(temporary)){
  if(!/^[a-z][a-z0-9-]*\.d\.mts$/.test(name))throw Error('Unexpected declaration output')
  copyFileSync(temporary+'/'+name,root+'src/'+name)
 }
}finally{rmSync(temporary,{recursive:true,force:true})}
