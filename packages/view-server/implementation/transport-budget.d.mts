// Minimal declaration for the published 0.10.0 Budget API, verified against its source.
declare module '@crowsi/transport-foundation' {
 interface Limits {accepted:number;buffered:number;frame:number;pendingBytes:number;pendingMessages:number}
 export function limitsFor(accepted?:number,options?:Partial<Limits>):Readonly<Limits>
 export class Budget {constructor(limits:Limits);reserve(bytes:number):()=>void}
}
