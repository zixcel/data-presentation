export function record(value) { return value !== null && typeof value === 'object' ? value : {}; }
export function eventDetail(event) { return record('detail' in event ? event.detail : null); }
export function copyPose(value) {
    const coordinates = [value.x, value.y, value.z, value.yaw, value.pitch, ...(value.focus ? [value.focus.x, value.focus.y, value.focus.z] : [])];
    if (!coordinates.every(Number.isFinite) || value.cameraMode !== undefined && !['overview', 'third-person'].includes(value.cameraMode))
        throw Error('WorldPoseInvalid');
    return { x: value.x, y: value.y, z: value.z, yaw: value.yaw, pitch: value.pitch, ...(value.focus ? { focus: { x: value.focus.x, y: value.focus.y, z: value.focus.z } } : {}), ...(value.cameraMode ? { cameraMode: value.cameraMode } : {}) };
}
