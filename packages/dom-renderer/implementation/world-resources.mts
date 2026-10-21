import {disposeGraphics} from './graphics-disposal.mjs'
interface Clearable {clear():void}
interface Closable {close():void}
export interface WorldResources {
 engine?:{close?():void};stopInput?:()=>void;stopFrame?:()=>void;resize?:{disconnect():void};controller?:{abort():void};orbit?:{dispose():void};gpu?:Closable|null;
 canvas?:Pick<HTMLCanvasElement,'getContext'>;initializations?:number;labelNodes?:Clearable;directoryNodes?:Clearable;recent?:Clearable;poses?:Clearable;wrap?:{remove():void};
}
// May also run after partial setup. Every acquired resource gets its own attempt.
export function disposeWorldResources(ctx:WorldResources,gpu=ctx.gpu):void{
 disposeGraphics([()=>ctx.stopInput?.(),()=>ctx.stopFrame?.(),()=>ctx.resize?.disconnect(),()=>ctx.controller?.abort(),()=>ctx.engine?.close?.(),()=>ctx.orbit?.dispose(),()=>gpu?.close(),
  ()=>{if((ctx.initializations??0)>0)ctx.canvas?.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext()},
  ()=>ctx.labelNodes?.clear(),()=>ctx.directoryNodes?.clear(),()=>ctx.recent?.clear(),()=>ctx.poses?.clear(),()=>ctx.wrap?.remove()])
}
