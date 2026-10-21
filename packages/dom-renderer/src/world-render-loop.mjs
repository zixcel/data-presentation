import { tickFrame } from './world-clock.mjs';
import { record } from './world-api.mjs';
import { cameraMatrix, screenPoint, renderSize, clamp, pickWorld } from './world-model.mjs';
import { createGpu } from './world-gpu.mjs';
import { objectBounds } from './object-presentation.mjs';
export function stopInputWorld(ctx) { ctx.keys?.clear(); ctx.drag = null; if (ctx.canvas && ctx.document?.pointerLockElement === ctx.canvas)
    ctx.document.exitPointerLock(); }
export function stopFrameWorld(ctx) { if (typeof ctx.frame === 'number') {
    ctx.window.cancelAnimationFrame(ctx.frame);
    ctx.frame = null;
} if (typeof ctx.motionTimer === 'number') {
    ctx.window.clearTimeout(ctx.motionTimer);
    ctx.motionTimer = null;
} ctx.last = 0; }
export function invalidateWorld(ctx) { ctx.dirty = true; if (!ctx.closed && ctx.attached && !ctx.paused && !ctx.lost && !ctx.document.hidden && ctx.frame === null)
    ctx.frame = ctx.window.requestAnimationFrame(ctx.tick); }
export const tickWorld = tickFrame;
export function drawWorld(ctx) {
    if (!ctx.gpu)
        return;
    const width = ctx.host.clientWidth, height = ctx.host.clientHeight;
    if (!width || !height)
        return;
    ctx.fitViewport();
    const size = renderSize(width, height, ctx.window.devicePixelRatio || 1);
    const matrix = cameraMatrix(ctx.pose, width / height, ctx.zoom);
    const visibleActors = new Set(ctx.model.items.filter(item => item.kind === 'character').filter(item => { const point = screenPoint(matrix, item.x, item.y + 1.5, item.z, width, height); return point?.visible && point.depth < 150; }).map(item => item.id));
    if (ctx.window.matchMedia('(prefers-reduced-motion: reduce)').matches)
        visibleActors.clear();
    ctx.gpu.draw(ctx.pose, width / height, ctx.zoom, size, ctx.window.performance.now(), visibleActors);
    ctx.frames++;
    ctx.positionBubble();
    ctx.wrap.dataset.animatedNpcs = String(visibleActors.size);
    if (visibleActors.size && ctx.motionTimer === null && !ctx.paused && !ctx.document.hidden)
        ctx.motionTimer = ctx.window.setTimeout(() => { ctx.motionTimer = null; ctx.invalidate(); }, 200);
    ctx.projected = [];
    for (const item of ctx.model.items) {
        const point = screenPoint(matrix, item.x, item.y + objectBounds[item.form][1] + .45, item.z, width, height);
        if (point?.visible && point.depth < 1800)
            ctx.projected.push({ item, ...point });
    }
    ctx.projected.sort((a, b) => a.depth - b.depth);
    const displayed = [], labelWidth = width < 600 ? 138 : 182;
    for (const point of ctx.projected) {
        const x = clamp(point.x, 90, width - 90), y = clamp(point.y, 96, Math.max(96, height - 80));
        if (displayed.some(p => Math.abs(p.x - x) < labelWidth && Math.abs(p.y - y) < 85))
            continue;
        displayed.push({ ...point, x, y });
        if (displayed.length === 8)
            break;
    }
    const visible = new Set(displayed.map(p => p.item.id));
    for (const [id, node] of ctx.labelNodes)
        node.hidden = !visible.has(id);
    for (const point of displayed) {
        const node = ctx.labelNodes.get(point.item.id);
        node.style.left = point.x + 'px';
        node.style.top = point.y + 'px';
        node.dataset.distance = point.depth.toFixed(1);
    }
    ctx.publishAnchor();
    ctx.hovered = pickWorld(ctx.model.items, ctx.pose, width / 2, height / 2, width, height, ctx.zoom);
    const target = ctx.model.items.find(item => item.id === ctx.hovered);
    ctx.inspect.disabled = !ctx.hovered;
    ctx.inspect.hidden = ctx.navigation === 'overview';
    ctx.aim.hidden = ctx.navigation === 'overview';
    ctx.hint.textContent = ctx.navigation === 'overview' ? (ctx.view.pattern === 'garden' ? `Open people · ${ctx.model.items.filter(item => item.kind === 'character').length}` : `Browse this space · ${ctx.model.items.length}`) : target ? target.title + ' · Inspect' : ctx.model.items.length ? 'Select a person or a group' : 'No information is visible in this view';
    ctx.hint.hidden = ctx.navigation !== 'overview' || !ctx.model.items.length;
    ctx.canvas.setAttribute('aria-label', ctx.navigation === 'overview' ? 'Explore your world. Drag to pan. Wheel or pinch to zoom. Select an object to focus. M for Map.' : 'Explore your world. W A S D or arrows to walk. Drag to look. E to interact. M for Map. Q to mark.');
    for (const [id, node] of ctx.labelNodes)
        node.dataset.aimed = String(id === ctx.hovered);
    ctx.wrap.dataset.pose = JSON.stringify(ctx.pose);
    ctx.wrap.dataset.frames = String(ctx.frames);
    ctx.wrap.dataset.instances = String(ctx.gpu.count);
    ctx.wrap.dataset.objects = String(ctx.model.items.length);
    ctx.wrap.dataset.bufferPixels = String(ctx.canvas.width * ctx.canvas.height);
    ctx.wrap.dataset.renderer = 'three';
    ctx.wrap.dataset.renderStats = JSON.stringify(ctx.gpu.stats);
    ctx.wrap.dataset.cameraMode = ctx.pose.cameraMode ?? 'overview';
    ctx.wrap.dataset.avatar = ctx.pose.cameraMode === 'third-person' ? 'present' : 'hidden';
    ctx.wrap.dataset.uploads = String(ctx.uploads);
    ctx.wrap.dataset.initializations = String(ctx.initializations);
    ctx.wrap.dataset.navigation = ctx.navigation;
}
export function failWorld(ctx, error) { const e = record(error); ctx.stopInput(); ctx.stopFrame(); ctx.status.hidden = false; ctx.status.textContent = (e.code ?? e.message ?? 'WorldRenderingUnavailable') + ' — The 3D view is unavailable. Use “In this space” to inspect the available information.'; ctx.wrap.dataset.gpu = 'unavailable'; }
export function initializeWorld(ctx) { try {
    ctx.gpu = createGpu(ctx.canvas);
    ctx.initializations++;
    ctx.gpu.pattern(ctx.view.pattern);
    if (ctx.geometry) {
        ctx.gpu.upload(ctx.geometry, ctx.actorRanges);
        ctx.gpu.motionStates(new Map(ctx.model.items.filter(i => i.kind === 'character').map(i => [i.id, ctx.roleStatus(ctx.workActivity, i.id)?.state ?? 'Idle'])));
        ctx.uploads++;
    }
    ctx.lost = false;
    ctx.status.hidden = true;
    ctx.wrap.dataset.gpu = 'ready';
    ctx.invalidate();
}
catch (error) {
    const failed = ctx.gpu;
    ctx.gpu = null;
    try {
        failed?.close();
    }
    catch (cleanup) {
        error = new AggregateError([error, cleanup], 'Graphics initialization and cleanup failed');
    }
    ctx.fail(error);
} }
