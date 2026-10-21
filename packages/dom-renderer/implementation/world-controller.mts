import {setupWorldView} from './world-setup.mjs'
import type {Camera} from '@zixcel/projection-client'
import type {WorldOptions,World,WorldSnapshot} from './world-api.mjs'
import type {WorldObject,WorldRelation} from './world-types.mjs'
import type {WorldContext} from './world-context.mjs'
import {objectRectWorld,publishAnchorWorld,syncOrbitWorld,overviewWorld,fitViewportWorld,focusObjectWorld,renderMapWorld,positionBubbleWorld} from './world-camera.mjs'
import {filterDirectoryWorld,renderUpdatesWorld,updateWorld} from './world-projection.mjs'
import {closeConversationWorld,activateWorld} from './world-conversation.mjs'
import {stopInputWorld,stopFrameWorld,invalidateWorld,tickWorld,drawWorld,failWorld,initializeWorld} from './world-render-loop.mjs'
import {onKeyWorld,snapshotWorld,parkWorld,mountWorld,closeWorld,activityWorld,applyWorld,changeWorld,pauseWorld} from './world-lifecycle.mjs'
export interface WorldController extends WorldContext {}
export class WorldController {
constructor(host:HTMLElement,{objects=[],relations=[],pose:restored,onActivate=()=>{},conversation=null,activity=null,target=null,pattern='ground',context=null,activityPresentation={}}:WorldOptions={}){
this.host=host;this.objects=objects;this.relations=relations;this.restored=restored;this.onActivate=onActivate;this.conversation=conversation;this.workActivity=activity;this.target=target;this.pattern=pattern;this.context=context;this.activityPresentation=activityPresentation;
try{
setupWorldView(this)
}catch(error){try{this.close()}catch(cleanup){throw new AggregateError([error,cleanup],'World setup and cleanup failed')}throw error}
}
objectRect=(id:string):{ left: number; right: number; top: number; bottom: number; } | null=>objectRectWorld(this,id)
publishAnchor=():void=>publishAnchorWorld(this)
filterDirectory=():void=>filterDirectoryWorld(this)
syncOrbit=():void=>syncOrbitWorld(this)
overview=():void=>overviewWorld(this)
fitViewport=():void=>fitViewportWorld(this)
focusObject=(id:string):void=>focusObjectWorld(this,id)
renderMap=():void=>renderMapWorld(this)
closeConversation=():void=>closeConversationWorld(this)
activate=(id:string | null | undefined):void=>activateWorld(this,id)
positionBubble=():void=>positionBubbleWorld(this)
stopInput=():void=>stopInputWorld(this)
stopFrame=():void=>stopFrameWorld(this)
invalidate=():void=>invalidateWorld(this)
tick=(now:number):void=>tickWorld(this,now)
draw=():void=>drawWorld(this)
fail=(error:unknown):void=>failWorld(this,error)
initialize=():void=>initializeWorld(this)
renderUpdates=():void=>renderUpdatesWorld(this)
update=(objects:WorldObject[],relations:WorldRelation[]=[]):void=>updateWorld(this,objects,relations)
onKey=(event:KeyboardEvent):void=>onKeyWorld(this,event)
snapshot=():WorldSnapshot=>snapshotWorld(this)
park=():void=>parkWorld(this)
mount=(nextHost:HTMLElement,options:WorldOptions):void=>mountWorld(this,nextHost,options)
close=():void=>closeWorld(this)
activity=(value:unknown):void=>activityWorld(this,value)
apply=(value:Camera):void=>applyWorld(this,value)
change=(action:string):void=>changeWorld(this,action)
pause=(value:boolean):void=>pauseWorld(this,value)
}
