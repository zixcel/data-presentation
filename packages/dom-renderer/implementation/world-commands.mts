import type {WorldOptions,WorldSnapshot} from './world-api.mjs'
import type {WorldObject,WorldRelation} from './world-types.mjs'
import type {Camera} from '@zixcel/projection-client'
export interface WorldCommands {
objectRect:(id: string) => { left: number; right: number; top: number; bottom: number; } | null;
publishAnchor:() => void;
filterDirectory:() => void;
syncOrbit:() => void;
overview:() => void;
fitViewport:() => void;
focusObject:(id: string) => void;
renderMap:() => void;
closeConversation:() => void;
activate:(id: string | null | undefined) => void;
positionBubble:() => void;
stopInput:() => void;
stopFrame:() => void;
invalidate:() => void;
tick:(now: number) => void;
draw:() => void;
fail:(error: unknown) => void;
initialize:() => void;
renderUpdates:() => void;
update:(objects: WorldObject[], relations?: WorldRelation[]) => void;
onKey:(event: KeyboardEvent) => void;
snapshot:() => WorldSnapshot;
park:() => void;
mount:(nextHost: HTMLElement, options: WorldOptions) => void;
close:() => void;
activity:(value: unknown) => void;
apply:(value: Camera) => void;
change:(action: string) => void;
pause:(value: boolean) => void;
}
