import { disposeGraphics } from './graphics-disposal.mjs';
// May also run after partial setup. Every acquired resource gets its own attempt.
export function disposeWorldResources(ctx, gpu = ctx.gpu) {
    disposeGraphics([() => ctx.stopInput?.(), () => ctx.stopFrame?.(), () => ctx.resize?.disconnect(), () => ctx.controller?.abort(), () => ctx.engine?.close?.(), () => ctx.orbit?.dispose(), () => gpu?.close(),
        () => { if ((ctx.initializations ?? 0) > 0)
            ctx.canvas?.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext(); },
        () => ctx.labelNodes?.clear(), () => ctx.directoryNodes?.clear(), () => ctx.recent?.clear(), () => ctx.poses?.clear(), () => ctx.wrap?.remove()]);
}
