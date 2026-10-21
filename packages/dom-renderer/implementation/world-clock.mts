import type {Pose} from './world-types.mjs'
import {worldLimits,movePose} from './world-model.mjs'
export interface FrameContext {
 frame:number|null;closed:boolean;attached:boolean;paused:boolean;lost:boolean;dirty:boolean;last:number;pose:Pose;keys:Set<unknown>;
 document:Pick<Document,'hidden'>;window:Pick<Window,'requestAnimationFrame'>;
 inputBlocked():boolean;tick(now:number):void;draw():void;fail(error:unknown):void;
}
export function tickFrame(ctx:FrameContext,now:number):void{
 try{
  ctx.frame=null;if(ctx.closed||!ctx.attached||ctx.paused||ctx.lost||ctx.document.hidden)return
  if(ctx.inputBlocked())ctx.keys.clear()
  const moving=ctx.keys.size>0
  if(now-ctx.last<1000/worldLimits.fps){if(ctx.dirty||moving)ctx.frame=ctx.window.requestAnimationFrame(ctx.tick);return}
  if(moving){ctx.pose=movePose(ctx.pose,Number(ctx.keys.has('forward'))-Number(ctx.keys.has('back')),Number(ctx.keys.has('right'))-Number(ctx.keys.has('left')),ctx.last?(now-ctx.last)/1000:1/30,Number(ctx.keys.has('rise'))-Number(ctx.keys.has('descend')));ctx.dirty=true}
  ctx.last=now
  if(ctx.dirty){ctx.dirty=false;ctx.draw()}
  if(moving)ctx.frame=ctx.window.requestAnimationFrame(ctx.tick)
  }catch(error){ctx.fail(error)}
}
