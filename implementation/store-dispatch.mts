import {randomUUID} from 'node:crypto'
import {canonical,validateSnapshot} from '@zixcel/projection-contracts'
import {check,clone,hash,shape,token} from './common.mjs'
import {record} from './store-record.mjs'
import type {StoreImage} from './store-model.mjs'
export function dispatch(s:StoreImage,operation:string,input:Record<string,unknown>):{value:unknown;changed:boolean}{
  let value:unknown=null,changed=false
  const find=(key:unknown)=>s.keys.find(k=>k.key===key)
  const initial=(key:unknown)=>hash(s.instance+'\0'+token(key))
  switch(operation){
    case 'create':break
    case 'inspect':value={keys:s.keys.map(({key,current,fence,snapshots})=>({key,current,fence,snapshots:snapshots.length})),repairs:clone(s.repairs),limits:s.limits};break
    case 'begin':value={key:input.key,expected:find(input.key)?.fence??initial(input.key)};break
    case 'read':{const k=find(input.key);const rev=input.revision??k?.current;value=k?.snapshots.find(p=>p.revision===rev)??null;if(value)validateSnapshot(value);break}
    case 'publish':{
      const {ticket}=input;const snapshot=validateSnapshot(input.snapshot);const jobId=token(input.jobId);shape(ticket,['key','expected']);token(ticket.key);token(ticket.expected);check(snapshot.key===ticket.key)
      let k=find(ticket.key);const prior=k?.receipts.find(r=>r.jobId===jobId)
      if(prior&&k){
        check(prior.revision===snapshot.revision,'ProjectionIdentityConflict');value=prior
        if(!k.snapshots.some(p=>p.revision===snapshot.revision)){k.snapshots.push(snapshot);k.snapshots=k.snapshots.slice(-s.limits.snapshots);changed=true}
        if(s.repairs.some(r=>r.id===jobId)){s.repairs=s.repairs.filter(r=>r.id!==jobId);changed=true}
        break
      }
      check((k?.fence??initial(ticket.key))===ticket.expected,'StaleProjectionPublication')
      if(!k){check(s.keys.length<s.limits.keys,'ProjectionLimitExceeded');k={key:token(ticket.key),fence:token(ticket.expected),current:null,snapshots:[],receipts:[]};s.keys.push(k)}
      if(!k.snapshots.some(p=>p.revision===snapshot.revision))k.snapshots.push(snapshot)
      k.snapshots=k.snapshots.slice(-s.limits.snapshots);k.fence=randomUUID();k.current=snapshot.revision
      const receipt={key:k.key,expected:token(ticket.expected),publication:k.fence,revision:snapshot.revision,jobId}
      value=receipt;k.receipts.push(receipt);k.receipts=k.receipts.slice(-s.limits.snapshots)
      // Result and removal of pending repair have one durable boundary.
      s.repairs=s.repairs.filter(r=>r.id!==jobId);changed=true;break
    }
    case 'pending':{
      const r=record(input.record),prior=s.repairs.find(p=>p.id===r.id)
      if(prior){
        check(canonical({...prior,holder:null,previous:[],attempts:0,failure:null,leases:[]})===canonical({...r,holder:null,previous:[],attempts:0,failure:null,leases:[]}),'ProjectionIdentityConflict')
        check(prior.holder===r.holder||input.previousHolder===prior.holder,'ProjectionAttemptConflict')
        check(r.attempts===prior.attempts+(prior.holder===r.holder?0:1),'ProjectionAttemptConflict')
        prior.holder=r.holder;prior.previous=r.previous;prior.attempts=r.attempts;prior.failure=r.failure;prior.leases=r.leases
      }
      else{check(s.repairs.length<s.limits.repairs,'ProjectionLimitExceeded');s.repairs.push(r)}
      changed=true;value=r;break
    }
    case 'repair':value=s.repairs.find(r=>r.id===input.id)??null;break
    case 'finish':s.repairs=s.repairs.filter(r=>r.id!==input.id);changed=true;break
    case 'drop':{const k=find(input.key);if(k){k.snapshots=[];changed=true}break}
    default:check(false)
  }
  return {value,changed}
}
