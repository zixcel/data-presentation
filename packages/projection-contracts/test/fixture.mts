import type {Json} from '../src/index.mjs'
export function fixture(){
  const a={owner:'semantic-owner',ref:'subject-snapshot',revision:'z-revision',kind:'semantic'},b={owner:'control-owner',ref:'control-snapshot',revision:'a-seven',kind:'control'}
  const value=(id: string,v: Json,semantic: string|null='exact-adopted-relation')=>({id,semanticRef:semantic,group:{kind:semantic?'semantic':'structural',ref:semantic??'/source/group'},value:v,
    evidence:['evidence:'+id],provenance:['provenance:'+id],resolutionRefs:[],visibility:'visible'})
  const sources=[{source:a,items:[value('one','A'),value('two','B')],relations:[{id:'conflict-link',from:'one',to:'two',relationRef:'owner-explicit-conflict'}],
    unresolved:[{id:'unknown',reason:'NeedsResolution',evidence:['unresolved-evidence'],contextRefs:['owner-context'],actionRefs:['owner-resolve']}],truncated:false},
    {source:b,items:[value('status','not-authorized',null)],relations:[],unresolved:[],truncated:false}]
  const request={key:'subject-view',producer:{id:'neutral-projector',version:'0.10.0',contract:'closed-contract',configuration:'configuration-A'},sources:[a,b],
    focus:'person',purpose:'review',visibilityRef:'owner-visibility-decision',limits:{}}
  const config={key:'scene',focus:'person',purpose:'review',regions:[{id:'main',role:'Primary',itemIds:['one','two']},{id:'resolve',role:'Resolution',itemIds:['unknown']}],
    actions:[{id:'resolve',targetOwner:'semantic-owner',commandRef:'owner-resolve',contextRefs:['unknown'],sourceRefs:[a],label:'Resolve'}]}
  return {sources,request,config}
}
