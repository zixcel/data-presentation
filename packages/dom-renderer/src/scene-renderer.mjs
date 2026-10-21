import { disposeGraphics } from './graphics-disposal.mjs';
import { element, fail } from './dom-elements.mjs';
import { spatialView } from './spatial.mjs';
import { reasonOf, appendSceneItems } from './scene-items.mjs';
import { reconcileChildren } from './reconcile.mjs';
import { createWorldSurface } from './world-surface.mjs';
import { bookReader } from './book-reader.mjs';
export class SceneRenderer {
    #root;
    #events;
    #abort = null;
    #actionHandles = new Map();
    #spatial = null;
    #slots;
    #pose = null;
    #poseKey = null;
    #speaker = null;
    #surface;
    #ownsSurface;
    #garden = null;
    constructor(root, onEvent, slots = {}, surface = null) { this.#root = root; this.#events = onEvent; this.#slots = slots; this.#surface = surface ?? createWorldSurface(); this.#ownsSurface = !surface; }
    render(plan) {
        const root = this.#root, document = root.ownerDocument, focused = document.activeElement instanceof document.defaultView.HTMLElement ? document.activeElement.dataset.control : undefined;
        const previous = root.querySelector('[data-render-key]'), oldViewport = root.querySelector('.scene-viewport');
        const scroll = previous?.dataset.renderKey === plan.projectionKey && previous.dataset.viewMode === plan.viewMode && oldViewport
            ? { left: oldViewport.scrollLeft, top: oldViewport.scrollTop } : null;
        if (this.#poseKey === plan.projectionKey)
            this.#pose = this.#spatial?.snapshot() ?? this.#pose;
        else
            this.#pose = null;
        this.#poseKey = plan.projectionKey;
        this.#spatial?.close();
        this.#spatial = null;
        this.#abort?.abort();
        this.#abort = new AbortController();
        this.#actionHandles.clear();
        if (!['spatial', 'structured'].includes(plan.viewMode) || !Array.isArray(plan.relations) || plan.relations.length > 512)
            fail('InvalidRenderPlan');
        const section = element(document, 'section', null, { 'data-render-revision': plan.projectionRevision, 'data-render-key': plan.projectionKey, 'data-view-mode': plan.viewMode, 'aria-label': 'Scene content', tabindex: '-1', class: 'semantic-scene' });
        const button = (label, kind, id, attrs = {}) => element(document, 'button', label, { type: 'button', 'data-kind': kind, 'data-control': JSON.stringify([kind, id]), 'data-target': id, ...attrs });
        const views = element(document, 'div', null, { role: 'group', 'aria-label': 'Scene view', class: 'scene-view-controls' });
        for (const [mode, label] of [['spatial', 'Spatial view'], ['structured', 'List view']])
            views.append(button(label, 'view', mode, { 'aria-pressed': plan.viewMode === mode }));
        const tools = this.#slots.tools ?? section;
        tools.replaceChildren();
        tools.append(views);
        const viewport = element(document, 'div', null, { class: 'scene-viewport', tabindex: '0', 'aria-label': 'Explore information in this space' }), board = element(document, 'div', null, { class: 'spatial-board' });
        for (const person of this.#garden?.actors ?? (this.#speaker ? [this.#speaker] : [])) {
            const actor = button('', this.#garden ? 'actor' : 'conversation', person.id, { 'data-world-object': person.id, 'data-selected': person.id === this.#speaker?.id, 'data-observation-label': person.preparation?.label ?? '' });
            actor.append(element(document, 'strong', person.title));
            actor.disabled = person.status !== undefined && person.status !== 'Available';
            board.append(actor);
        }
        const camera = element(document, 'div', null, { role: 'group', 'aria-label': 'View position', class: 'scene-camera' });
        for (const [id, label, icon] of [['left', 'Move left', '←'], ['right', 'Move right', '→'], ['in', 'Zoom in', '+'], ['out', 'Zoom out', '−'], ['reset', 'View all', '⛶']])
            camera.append(button(icon, 'camera', id, { 'aria-label': label, title: label }));
        if (plan.viewMode === 'spatial')
            tools.append(camera);
        viewport.append(board);
        (plan.viewMode === 'structured' ? tools : section).append(viewport);
        if (plan.empty)
            section.append(element(document, 'p', 'No projected information is available.', { role: 'status' }));
        if (plan.truncated)
            section.append(element(document, 'p', 'The source reports incomplete information.', { role: 'status' }));
        const groups = [...plan.regions, ...(plan.unplaced.length ? [{ id: 'unplaced', role: 'Context', items: plan.unplaced }] : [])];
        if (groups.length > 17 || plan.actions.length > 64)
            fail('RenderLimitExceeded');
        appendSceneItems(document, board, groups, plan, button);
        const time = element(document, 'section', null, { 'aria-label': 'Scene time', class: 'scene-time' });
        time.append(element(document, 'h2', plan.temporal?.label ?? 'Time'));
        if (plan.temporal?.items.length) {
            time.append(button('All times', 'time', '', { 'aria-pressed': plan.temporal.cursor === null }));
            for (const item of plan.temporal.items) {
                const control = button(item.at + ' · ' + item.itemId, 'time', item.itemId, { 'aria-pressed': plan.temporal.cursor === item.itemId });
                time.append(control);
            }
        }
        else
            time.append(element(document, 'p', 'No event time has been declared by this source.', { role: 'status' }));
        tools.append(time);
        if (plan.relations.length) {
            const relations = element(document, 'details', null, { 'aria-label': 'Relationships' }), list = element(document, 'ul', null, { class: 'scene-relations' });
            relations.append(element(document, 'summary', 'Relationships (' + plan.relations.length + ')'), list);
            for (const relation of plan.relations) {
                const row = element(document, 'li', null, { 'data-relation-id': relation.id, 'data-active': relation.active });
                row.append(button(relation.from, 'select', relation.from, { 'data-control': JSON.stringify(['relation', relation.id, 'from']), 'aria-label': 'Select related ' + relation.from }), element(document, 'span', '→ ' + relation.relationRef + ' →'), button(relation.to, 'select', relation.to, { 'data-control': JSON.stringify(['relation', relation.id, 'to']), 'aria-label': 'Select related ' + relation.to }));
                list.append(row);
            }
            tools.append(relations);
        }
        const actions = this.#slots.actions ?? tools;
        if (this.#slots.actions)
            actions.replaceChildren();
        // Unresolved owner observations are conversation material too, including
        // when no executable choice exists. This does not manufacture an action.
        const pending = groups.flatMap(group => group.items).filter(item => reasonOf(item));
        if (pending.length) {
            const questions = element(document, 'section', null, { 'aria-label': 'Information needing clarification' });
            questions.append(element(document, 'h3', 'Why this information needs review'));
            for (const item of pending) {
                const row = element(document, 'div', null, { 'data-unresolved-ref': item.id });
                const reason = reasonOf(item);
                if (!reason)
                    continue;
                const explanation = this.#slots.describeUnresolved?.(reason) ?? { label: String(reasonOf(item)), detail: 'The source owner reported this unresolved reason.' };
                row.append(button(item.display?.title ?? explanation.label, 'resolve', item.id), element(document, 'small', explanation.detail));
                questions.append(row);
            }
            actions.append(questions);
        }
        for (const action of plan.actions) {
            this.#actionHandles.set(action.handle.actionId, action.handle);
            actions.append(button(action.descriptor.label, 'action', action.handle.actionId));
        }
        const lastBook = (this.#slots.details ?? root).querySelector('[data-book-id]'), bookPosition = lastBook ? { id: lastBook.dataset.bookId, revision: lastBook.dataset.bookRevision, page: Number(lastBook.dataset.bookPage) } : null;
        this.#slots.details?.replaceChildren();
        if (plan.inspector) {
            const inspector = plan.inspector;
            const chosen = groups.flatMap(r => r.items).find(i => i.id === inspector.id);
            if (chosen)
                (this.#slots.details ?? section).append(bookReader(document, chosen, plan.projectionRevision, button('Close book', 'dismiss', plan.inspector.id), this.#abort.signal, bookPosition));
        }
        reconcileChildren(root, [section]);
        const activeViewport = plan.viewMode === 'spatial' ? root.querySelector('.scene-viewport') : viewport, activeBoard = activeViewport.querySelector('.spatial-board');
        if (!activeViewport || !activeBoard)
            fail('InvalidRenderPlan');
        if (plan.viewMode === 'spatial' || this.#garden)
            this.#spatial = spatialView(this.#garden?.host ?? activeViewport, activeBoard, plan.camera, plan.relations, this.#abort.signal, this.#pose, null, {
                surface: this.#surface, activity: this.#garden?.activity, target: this.#garden ? 'garden' : plan.projectionKey, context: this.#garden ? plan.projectionKey : null, pattern: this.#garden ? 'garden' : 'constellation', items: new Map(groups.flatMap(region => region.items.map(item => [item.id, {
                        anchor: this.#speaker?.id, group: 'group' in item.content ? item.content.group : null, semanticRef: 'semanticRef' in item.content ? item.content.semanticRef : null, sourceRefs: item.content.sourceRefs, scalars: (item.display?.fields ?? []).map(f => f.value), unresolved: Boolean(reasonOf(item)), changeKey: JSON.stringify(item.display?.fields ?? [])
                    }])))
            });
        if (this.#garden && plan.viewMode === 'structured')
            activeBoard.hidden = false;
        for (const host of new Set([root, this.#slots.tools, this.#slots.details, this.#slots.actions].filter((host) => Boolean(host))))
            host.addEventListener('click', event => {
                const target = (event.target instanceof document.defaultView.Element ? event.target.closest('button[data-kind]') : null);
                if (!target || !host.contains(target) || !target.dataset.kind)
                    return;
                if (target.dataset.kind === 'camera') {
                    this.#spatial?.change(target.dataset.target ?? '');
                    return;
                }
                this.#events(target.dataset.kind, target.dataset.kind === 'action' ? this.#actionHandles.get(target.dataset.target ?? '') : target.dataset.target);
            }, { signal: this.#abort.signal });
        if (focused)
            [...root.querySelectorAll('[data-control]')].find(n => n.dataset.control === focused)?.focus({ preventScroll: true });
        if (scroll) {
            viewport.scrollLeft = scroll.left;
            viewport.scrollTop = scroll.top;
        }
    }
    camera(value) { this.#spatial?.apply(value); }
    speaker(value) { this.#speaker = value; }
    garden(value) { this.#garden = value; }
    activity(value) { this.#spatial?.activity(value); }
    changeCamera(action) { this.#spatial?.change(action); }
    close() {
        const spatial = this.#spatial, abort = this.#abort, surface = this.#ownsSurface ? this.#surface : null;
        this.#spatial = null;
        this.#abort = null;
        this.#actionHandles.clear();
        if (this.#ownsSurface)
            this.#surface = createWorldSurface();
        disposeGraphics([() => spatial?.close(), () => abort?.abort(), () => this.#root.replaceChildren(),
            ...[this.#slots.tools, this.#slots.details, this.#slots.actions].filter((slot) => Boolean(slot)).map(slot => () => slot.replaceChildren()), () => surface?.close()]);
    }
    dispose() { this.close(); if (this.#ownsSurface)
        this.#surface.close(); }
}
