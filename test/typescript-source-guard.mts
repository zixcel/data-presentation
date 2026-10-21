import {createScanner,SyntaxKind} from 'typescript/unstable/ast'
// Use the pinned compiler's tokenization so text literals and comments are not types.
export function hasUncheckedToken(source:string):boolean{
 const scanner=createScanner(true,undefined,source)
 for(let token=scanner.scan();token!==SyntaxKind.EndOfFile;token=scanner.scan()){
  if(token===SyntaxKind.AnyKeyword)return true
 }
 return false
}
