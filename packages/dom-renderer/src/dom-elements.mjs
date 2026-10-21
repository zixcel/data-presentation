// Trusted DOM primitives: external values are rendered as text, never HTML.
export const renderBounds = Object.freeze({ nodes: 8192, depth: 20, textBytes: 524288 });
export function fail(code) { throw Object.assign(Error(code), { code }); }
export function element(document, tag, text = null, attrs = {}) {
    const node = document.createElement(tag);
    if (text !== null)
        node.textContent = String(text);
    for (const [key, value] of Object.entries(attrs))
        if (value !== null)
            node.setAttribute(key, String(value));
    return node;
}
export function valueView(document, value, budget = { nodes: 0, bytes: 0 }) {
    function walk(value, depth) {
        if (++budget.nodes > renderBounds.nodes || depth > renderBounds.depth)
            fail('RenderLimitExceeded');
        if (value === null || typeof value !== 'object') {
            if (typeof value === 'string' && value.length > renderBounds.textBytes)
                fail('RenderLimitExceeded');
            const text = JSON.stringify(value);
            if (typeof text !== 'string')
                fail('InvalidRenderValue');
            budget.bytes += new TextEncoder().encode(text).length;
            if (budget.bytes > renderBounds.textBytes)
                fail('RenderLimitExceeded');
            return element(document, 'span', text, { 'data-projection-scalar': text });
        }
        if (Object.keys(value).length > 4096)
            fail('RenderLimitExceeded');
        if (!Object.keys(value).length)
            return element(document, 'span', Array.isArray(value) ? '[]' : '{}', { 'data-empty-value': Array.isArray(value) ? 'array' : 'object' });
        const list = element(document, Array.isArray(value) ? 'ol' : 'dl');
        for (const [key, child] of Object.entries(value)) {
            if (Array.isArray(value)) {
                const item = element(document, 'li');
                item.append(walk(child, depth + 1));
                list.append(item);
            }
            else {
                const name = element(document, 'dt', key), item = element(document, 'dd');
                item.append(walk(child, depth + 1));
                list.append(name, item);
            }
        }
        return list;
    }
    return walk(value, 0);
}
