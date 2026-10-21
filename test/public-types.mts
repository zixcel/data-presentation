import { ProjectionRuntime, ProducerRegistry, ExactSourceReader, type SourceReader } from '@zixcel/projection-runtime';
import { FileProjectionStore } from '@zixcel/projection-runtime/store';
const registry = new ProducerRegistry();
const identity = registry.register({ id: 'builtin', kind: 'data' });
registry.exact(identity);
registry.unregister(identity);
const store: FileProjectionStore = new FileProjectionStore('/private/projections');
const reader: SourceReader = { async acquireExact() { return { sources: [], leaseRefs: [] } }, async release() {} };
const runtime = new ProjectionRuntime({ store, registry, reader });
const state = runtime.recoverState({ key: 'example' });
if (state.kind === 'Snapshot') { const payload: Uint8Array = state.payload; void payload; }
const inspection: number = runtime.inspect().active;
void inspection;
// @ts-expect-error Exact source adapters must include lost-response holder cleanup.
new ExactSourceReader(new Map([['example', { acquire() {return 'lease'}, read() {}, release() {} }]]));

import {createWorldSurface} from '@zixcel/dom-renderer';
declare const host:HTMLElement;
const surface=createWorldSurface();const lease=surface.attach(host,{objects:[{id:'example',title:'Example'}]});
lease.world.update([{id:'example'}]);
// @ts-expect-error Mutable GPU state is not part of the public presentation interface.
lease.world.gpu;
// @ts-expect-error Native host ownership is internal to the presentation controller.
lease.world.host;
lease.release();surface.close();
