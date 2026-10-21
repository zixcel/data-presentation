/** Drain each independently owned resource; preserve falsy failures too. */
export function disposeGraphics(operations:readonly (()=>void)[]):void {
 const failures:unknown[]=[]
 for(const operation of operations){try{operation()}catch(error){failures.push(error)}}
 if(failures.length)throw new AggregateError(failures,'Graphics cleanup failed')
}
