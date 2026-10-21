import { bounds } from '@zixcel/view-delivery-contracts';
export function fail(code) { throw Object.assign(Error(code), { code }); }
export const record = (v) => v !== null && typeof v === 'object' ? v : {};
export function header(request, name) { const v = request.headers[name]; if (v !== undefined && typeof v !== 'string')
    fail('InvalidInput'); return v ?? ''; }
export const headers = {
    'content-security-policy': "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'self'",
    'referrer-policy': 'no-referrer', 'x-content-type-options': 'nosniff', 'x-frame-options': 'DENY',
    'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=()', 'cache-control': 'no-store'
};
export const encode = (value, maximum = bounds.documentBytes) => {
    // Site/owner outputs are already bounded data. Refuse expansion before sending.
    let nodes = 0, total = 0;
    const add = (bytes) => { total += bytes; if (total > maximum)
        fail('DeliveryLimitExceeded'); };
    function check(v, depth) {
        if (++nodes > 32768 || depth > 20)
            fail('DeliveryLimitExceeded');
        if (typeof v === 'string') {
            if (v.length > maximum)
                fail('DeliveryLimitExceeded');
            add(Buffer.byteLength(v) + 2);
            return;
        }
        if (v === null || typeof v === 'boolean') {
            add(5);
            return;
        }
        if (typeof v === 'number' && Number.isFinite(v)) {
            add(24);
            return;
        }
        if (!v || typeof v !== 'object' || Object.getPrototypeOf(v) !== (Array.isArray(v) ? Array.prototype : Object.prototype) || Object.hasOwn(v, 'toJSON'))
            fail('InvalidDeliveryData');
        if (Array.isArray(v) && v.length > 4096)
            fail('DeliveryLimitExceeded');
        const keys = Object.keys(v);
        if (Array.isArray(v) && (keys.length !== v.length || keys.some((key, index) => key !== String(index))))
            fail('InvalidDeliveryData');
        if (keys.length > 4096)
            fail('DeliveryLimitExceeded');
        add(keys.length + 2);
        for (const key of keys) {
            const d = Object.getOwnPropertyDescriptor(v, key);
            if (!d || d.get || d.set || key === 'toJSON')
                fail('InvalidDeliveryData');
            add(Buffer.byteLength(key) + 3);
            check(d.value, depth + 1);
        }
    }
    check(value, 0);
    const bytes = Buffer.from(JSON.stringify(value));
    if (bytes.length > maximum)
        fail('DeliveryLimitExceeded');
    return bytes;
};
export async function body(request, signal) {
    const h = request.headers, raw = h['content-length'];
    if (h['content-encoding'] || h['transfer-encoding'] || !/^application\/json(?:\s*;.*)?$/i.test(h['content-type'] ?? '') || !(/^[1-9][0-9]{0,5}$/).test(raw ?? ''))
        fail('InvalidInput');
    const size = Number(raw);
    if (size > bounds.requestBytes)
        fail('DeliveryLimitExceeded');
    const data = Buffer.alloc(size);
    let used = 0;
    for await (const chunk of request) {
        if (!Buffer.isBuffer(chunk))
            fail('InvalidInput');
        if (signal.aborted)
            fail('DeliveryCancelled');
        if (used + chunk.length > size)
            fail('DeliveryLimitExceeded');
        chunk.copy(data, used);
        used += chunk.length;
    }
    if (used !== size)
        fail('InvalidInput');
    try {
        return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(data));
    }
    catch {
        fail('InvalidInput');
    }
}
export function sessionId(request, cookieName) {
    const cookie = request.headers.cookie ?? '';
    if (cookie.length > 8192)
        fail('SessionRejected');
    const values = cookie.split(';').map(s => s.trim()).filter(s => s.startsWith(cookieName + '='));
    if (values.length !== 1)
        fail('SessionRejected');
    return values[0].slice(cookieName.length + 1);
}
export function safeDocument(envelope, bootstrap, title) {
    const serialized = encode({ envelope, bootstrap }).toString().replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
    const styles = envelope.assets.filter(a => a.kind === 'style').map(a => `<link rel="stylesheet" href="${a.path}">`).join('');
    const scripts = envelope.assets.filter(a => a.kind === 'script').map(a => `<script type="module" src="${a.path}"></script>`).join('');
    return Buffer.from(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>${styles}</head><body><main id="app" aria-busy="true"><p role="status">Loading exact state…</p></main><script id="delivery-state" type="application/json">${serialized}</script>${scripts}</body></html>`);
}
export function send(response, status, value) { const bytes = encode(value); response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'content-length': bytes.length }); response.end(bytes); }
