import { WorldController } from './world-controller.mjs';
export function createWorld(host, options = {}) {
    const controller = new WorldController(host, options);
    // Only the installed presentation interface escapes; mutable lifecycle state stays private.
    return Object.freeze({ update: controller.update, close: controller.close, park: controller.park, mount: controller.mount, snapshot: controller.snapshot,
        activity: controller.activity, apply: controller.apply, change: controller.change, pause: controller.pause });
}
