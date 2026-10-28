import {createScanner,SyntaxKind} from 'typescript/unstable/ast'
// Use the pinned compiler's tokenization so text literals and comments are not types.
export function hasUncheckedToken(source:string):boolean{
 const scanner=createScanner(true,undefined,source)
 let previous=-1
 for(let token=scanner.scan();token!==SyntaxKind.EndOfFile;token=scanner.scan()){
  const end=scanner.getTokenEnd()
  if(end<=previous)throw Error('TypeScript scanner did not advance')
  previous=end
  if(token===SyntaxKind.AnyKeyword)return true
 }
 return false
}
