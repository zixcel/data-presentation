import type {SourceReader} from './types/runtime.mjs'
export interface HeldSources {readonly holder:string;readonly leases:readonly string[]}
export async function cleanupHolds(reader: SourceReader,sets: readonly HeldSources[]): Promise<void> {
  let failed=false,failure: unknown
  for(const {holder,leases} of sets){
    try{await reader.release(leases,holder)}catch(error){if(!failed){failure=error;failed=true}}
  }
  if(failed)throw failure
}
