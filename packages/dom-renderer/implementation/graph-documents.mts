import type {InspectionOverview} from './inspection-overview.mjs'
export interface GraphDocument {id:string;label:string;value:unknown;source?:{method?:string;semanticRevision?:string;memoryRevision?:string;truncated?:boolean;roleRef?:{id?:string;revision?:string;digest_sha256?:string}}}
export interface GraphNode {id:string;label:string;path:string;level:number;value:unknown;document:GraphDocument}
export interface GraphEdge {from:string;to:string;label:string}
export interface GraphView {roles:readonly {id:string}[];selected?:string|null;documents:GraphDocument[];overview:InspectionOverview|null}
// Hatter 2026: bounded document-containment graph. No meaning inference or writes.
export function graphDocuments(documents:GraphDocument[],{component='',query='',depth=3,maximum=256}={}){
 if(!Array.isArray(documents)||documents.length>32||!Number.isInteger(depth)||depth<1||depth>6||!Number.isSafeInteger(maximum)||maximum<1||maximum>256)throw Error('GraphInputInvalid')
 const nodes:GraphNode[]=[],edges:GraphEdge[]=[];let truncated=false
 const add=(value:unknown,label:string,path:string,level:number,parent:string|null,document:GraphDocument):void=>{
  if(nodes.length>=maximum){truncated=true;return}
  const id=document.id+':'+path,node={id,label,path,level,value,document}
  nodes.push(node);if(parent)edges.push({from:parent,to:id,label})
  if(value&&typeof value==='object'){
   const entries=Object.entries(value)
   if(level>=depth){if(entries.length)truncated=true;return}
   for(const [key,child]of entries){if(nodes.length>=maximum){truncated=true;break}add(child,key,path+'/'+key.replaceAll('~','~0').replaceAll('/','~1'),level+1,id,document)}
  }
 }
 for(const doc of documents)if(!component||doc.id===component)add(doc.value,doc.label,'',0,null,doc)
 if(query){const matches=new Set(nodes.filter(n=>(n.label+' '+n.path+' '+(n.value===null||typeof n.value!=='object'?String(n.value):'')).toLowerCase().includes(query.toLowerCase())).map(n=>n.id));return {nodes:nodes.filter(n=>matches.has(n.id)),edges:edges.filter(e=>matches.has(e.from)&&matches.has(e.to)),truncated}}
 return {nodes,edges,truncated}
}
