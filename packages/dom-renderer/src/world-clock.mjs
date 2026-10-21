import { worldLimits, movePose } from './world-model.mjs';
export function tickFrame(ctx, now) {
    try {
        ctx.frame = null;
        if (ctx.closed || !ctx.attached || ctx.paused || ctx.lost || ctx.document.hidden)
            return;
        if (ctx.inputBlocked())
            ctx.keys.clear();
        const moving = ctx.keys.size > 0;
        if (now - ctx.last < 1000 / worldLimits.fps) {
            if (ctx.dirty || moving)
                ctx.frame = ctx.window.requestAnimationFrame(ctx.tick);
            return;
        }
        if (moving) {
            ctx.pose = movePose(ctx.pose, Number(ctx.keys.has('forward')) - Number(ctx.keys.has('back')), Number(ctx.keys.has('right')) - Number(ctx.keys.has('left')), ctx.last ? (now - ctx.last) / 1000 : 1 / 30, Number(ctx.keys.has('rise')) - Number(ctx.keys.has('descend')));
            ctx.dirty = true;
        }
        ctx.last = now;
        if (ctx.dirty) {
            ctx.dirty = false;
            ctx.draw();
        }
        if (moving)
            ctx.frame = ctx.window.requestAnimationFrame(ctx.tick);
    }
    catch (error) {
        ctx.fail(error);
    }
}
