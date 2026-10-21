import type {ObjectForm,ObjectPresentation} from './object-presentation.mjs'
export interface VectorPoint {x:number;y:number;z:number}
export interface Pose extends VectorPoint {yaw:number;pitch:number;focus?:VectorPoint;cameraMode?:'third-person'|'overview'}
export interface WorldObject {
 id:string;title?:string;kind?:string;form?:ObjectForm;summary?:string;anchor?:string;plot?:number;member?:number;
 selected?:boolean;disabled?:boolean;scalars?:readonly unknown[];unresolved?:unknown;needsReview?:boolean;
 group?:{kind:string;ref:string}|null;groupLabel?:string;semanticRef?:string|null;
 sourceRefs?:readonly {owner:string}[];memberIds?:readonly string[];changeKey?:string;supportRef?:string;observationLabel?:string;
}
export type WorldItem<T extends WorldObject=WorldObject>=T&ObjectPresentation&VectorPoint
export interface WorldRelation {id?:string;from:string;to:string;active?:boolean}
export interface WorldModel<T extends WorldObject=WorldObject> {items:WorldItem<T>[];relations:WorldRelation[];pattern?:string}
export interface ActorRange {id:string;start:number;end:number}
export interface Gpu {
 pattern(value:string):void;upload(data:Float32Array,ranges?:ActorRange[]):void;motionStates(states:Map<string,string>):void;
 draw(pose:Pose,aspect:number,zoom:number,size:{width:number;height:number},milliseconds?:number,visibleActors?:Set<string>):void;
 readonly count:number;readonly stats:{calls:number;triangles:number;geometries:number;textures:number};close():void;
}
