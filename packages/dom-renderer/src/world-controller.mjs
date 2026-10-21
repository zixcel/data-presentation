import { setupWorldView } from './world-setup.mjs';
import { objectRectWorld, publishAnchorWorld, syncOrbitWorld, overviewWorld, fitViewportWorld, focusObjectWorld, renderMapWorld, positionBubbleWorld } from './world-camera.mjs';
import { filterDirectoryWorld, renderUpdatesWorld, updateWorld } from './world-projection.mjs';
import { closeConversationWorld, activateWorld } from './world-conversation.mjs';
import { stopInputWorld, stopFrameWorld, invalidateWorld, tickWorld, drawWorld, failWorld, initializeWorld } from './world-render-loop.mjs';
import { onKeyWorld, snapshotWorld, parkWorld, mountWorld, closeWorld, activityWorld, applyWorld, changeWorld, pauseWorld } from './world-lifecycle.mjs';
export class WorldController {
    constructor(host, { objects = [], relations = [], pose: restored, onActivate = () => { }, conversation = null, activity = null, target = null, pattern = 'ground', context = null, activityPresentation = {} } = {}) {
        this.host = host;
        this.objects = objects;
        this.relations = relations;
        this.restored = restored;
        this.onActivate = onActivate;
        this.conversation = conversation;
        this.workActivity = activity;
        this.target = target;
        this.pattern = pattern;
        this.context = context;
        this.activityPresentation = activityPresentation;
        try {
            setupWorldView(this);
        }
        catch (error) {
            try {
                this.close();
            }
            catch (cleanup) {
                throw new AggregateError([error, cleanup], 'World setup and cleanup failed');
            }
            throw error;
        }
    }
    objectRect = (id) => objectRectWorld(this, id);
    publishAnchor = () => publishAnchorWorld(this);
    filterDirectory = () => filterDirectoryWorld(this);
    syncOrbit = () => syncOrbitWorld(this);
    overview = () => overviewWorld(this);
    fitViewport = () => fitViewportWorld(this);
    focusObject = (id) => focusObjectWorld(this, id);
    renderMap = () => renderMapWorld(this);
    closeConversation = () => closeConversationWorld(this);
    activate = (id) => activateWorld(this, id);
    positionBubble = () => positionBubbleWorld(this);
    stopInput = () => stopInputWorld(this);
    stopFrame = () => stopFrameWorld(this);
    invalidate = () => invalidateWorld(this);
    tick = (now) => tickWorld(this, now);
    draw = () => drawWorld(this);
    fail = (error) => failWorld(this, error);
    initialize = () => initializeWorld(this);
    renderUpdates = () => renderUpdatesWorld(this);
    update = (objects, relations = []) => updateWorld(this, objects, relations);
    onKey = (event) => onKeyWorld(this, event);
    snapshot = () => snapshotWorld(this);
    park = () => parkWorld(this);
    mount = (nextHost, options) => mountWorld(this, nextHost, options);
    close = () => closeWorld(this);
    activity = (value) => activityWorld(this, value);
    apply = (value) => applyWorld(this, value);
    change = (action) => changeWorld(this, action);
    pause = (value) => pauseWorld(this, value);
}
