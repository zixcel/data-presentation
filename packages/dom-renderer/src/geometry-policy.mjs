import { worldLimits } from './world-model.mjs';
/** Validate the complete upload before allocating or updating GPU state. */
export function admitGeometry(data, ranges) {
    const fail = () => { throw Error('WorldGeometryLimitExceeded'); };
    if (!(data instanceof Float32Array) || data.length % 9 || data.length / 9 >= worldLimits.instances || ranges.length > worldLimits.objects)
        fail();
    for (const value of data)
        if (!Number.isFinite(value))
            fail();
    const ids = new Set(), count = data.length / 9;
    for (const range of ranges) {
        if (!range || typeof range.id !== 'string' || !range.id || range.id.length > 512 || ids.has(range.id) ||
            !Number.isSafeInteger(range.start) || !Number.isSafeInteger(range.end) || range.start < 0 || range.end <= range.start || range.end > count)
            fail();
        ids.add(range.id);
    }
}
