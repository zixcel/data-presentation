import {canonical,digest,frozen} from './contract.mjs'
import type {Snapshot} from './types/publication.mjs'
type ForKind<K extends Snapshot['kind']>=Extract<Snapshot,{kind:K}>
export function seal<K extends Snapshot['kind']>(kind: K,key: string,lineage: ForKind<K>['lineage'],data: ForKind<K>['data'],maximum: number): ForKind<K> {
  const body={contract:'projection/0.10.0' as const,kind,key,lineage,data}
  const snapshot={...body,revision:'pp:'+digest(body)}
  canonical(snapshot,maximum);return frozen(snapshot) as ForKind<K>
}
