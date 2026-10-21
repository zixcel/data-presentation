import { validateSnapshot, copy, frozen, ProjectionError } from '@zixcel/projection-contracts/client';
export function fail(code) { throw new ProjectionError(code); }
export function check(value, code) { if (!value)
    fail(code); }
export const empty = () => ({ activeScene: null, focus: null, selectedItems: [], expandedItems: [], activeRegion: null,
    navigation: [], navigationIndex: -1, inspector: null, loading: false, viewMode: 'spatial', camera: { x: 0, y: 0, z: 1 }, timeCursor: null });
export const projectionIdentity = (s) => frozen(copy({ key: s.key, revision: s.revision, lineage: s.lineage }));
export function sceneSnapshot(value) { const snapshot = validateSnapshot(value); check(snapshot.kind === 'Scene', 'SceneUnavailable'); return frozen(copy(snapshot)); }
export function targets(snapshot) { return new Set([...snapshot.data.items, ...snapshot.data.unresolved].map(i => i.id)); }
export function rebase(previous, snapshot) {
    const ids = targets(snapshot), regions = new Set(snapshot.data.regions.map(r => r.id));
    return frozen({ ...previous, activeScene: snapshot.key, focus: ids.has(previous.focus ?? '') ? previous.focus : null,
        selectedItems: previous.selectedItems.filter(id => ids.has(id)), expandedItems: previous.expandedItems.filter(id => ids.has(id)),
        activeRegion: regions.has(previous.activeRegion ?? '') ? previous.activeRegion : null, inspector: ids.has(previous.inspector ?? '') ? previous.inspector : null,
        timeCursor: snapshot.data.temporal?.items.some(item => item.itemId === previous.timeCursor) ? previous.timeCursor : null });
}
