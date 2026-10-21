import type {World,WorldOptions,WorldSurface,WorldLease,ActivityPresentation} from '../../src/world-api.mjs'
import type {WorldObject} from '../../src/world-types.mjs'
interface WorkActivity {available:boolean;counts?:Record<string,number>;roles?:{roleRef:{id:string};kind:string;state:string}[];driverPhase?:string}
declare global {
 interface Window {
  makeWorld:(host:HTMLElement,options?:WorldOptions)=>World;makeSurface:(adapter?:ActivityPresentation)=>WorldSurface;openWorld:()=>World;
  activations:string[];objects:WorldObject[];world:World;surface:WorldSurface;lease:WorldLease;gpuLoss:WEBGL_lose_context;
  savedCanvas:Element|null;savedLabel:Element|null;savedUploads:string|undefined;sharedCanvas:Element|null;sharedLabel:Element|null;
  workActivity:WorkActivity;activityOptions:WorldOptions;parkedWrap:HTMLElement;
 }
}
