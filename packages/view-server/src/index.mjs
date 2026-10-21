// Caller-owned delivery and lifecycle. Crowsi retains transport/session/ACK/recovery.
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { WebSocketServer } from 'ws';
import { StateSocketServer } from '@crowsi/transport-foundation/state-socket';
import { bounds } from '@zixcel/view-delivery-contracts';
import { prepareDelivery } from './prepare.mjs';
import { createHandler } from './handler.mjs';
import { send, fail, record } from './wire.mjs';
import { sourceFailure } from './failure.mjs';
export function createDeliveryServer(options) {
    const { site, origin, onFailure, onOutcome } = options;
    const prepared = prepareDelivery(options), { ownerPolicy, boundary, budget } = prepared;
    const { handle, authorize, authenticate } = createHandler(options, prepared);
    const inflight = new Set(), controllers = new Set(), requests = new WeakMap();
    let closing = false, closePromise = null;
    const hub = new StateSocketServer({ authorize: peer => { const request = requests.get(peer); if (!request)
            fail('SessionRejected'); authorize(request); if (request.headers.origin !== origin)
            fail('OriginRequired'); return authenticate(request); }, read: async (request) => {
            if (!site.live)
                fail('SourceUnavailable');
            const value = record(await site.live(request));
            if (value.kind === 'RecoveryUnavailable')
                return { kind: 'RecoveryUnavailable', detail: value.detail };
            if (value.kind === 'NoChange' && typeof value.revision === 'string')
                return { kind: 'NoChange', revision: value.revision };
            if (value.kind === 'Snapshot' && typeof value.revision === 'string' && value.payload instanceof Uint8Array)
                return { kind: 'Snapshot', revision: value.revision, payload: value.payload };
            return fail('InvalidDeliveryData');
        } });
    const sockets = new WebSocketServer({ noServer: true, maxPayload: 1048578, perMessageDeflate: false, clientTracking: true });
    const server = http.createServer({ maxHeaderSize: 16384, headersTimeout: 5000, requestTimeout: 5000, keepAliveTimeout: 2000 }, (request, response) => {
        if (closing) {
            response.writeHead(503);
            response.end();
            return;
        }
        let release;
        try {
            release = budget.reserve(0);
        }
        catch {
            send(response, 503, { error: { code: 'DeliveryQueueFull' } });
            return;
        }
        const controller = new AbortController();
        controllers.add(controller);
        const abort = () => controller.abort();
        response.once('close', abort);
        const observation = { requestRef: randomUUID(), owner: ownerPolicy.owner, stage: 'DELIVERY_REJECTED', receiptRef: null };
        // Paths and query strings are caller input, not safe diagnostic labels.
        const path = request.url?.split('?')[0], operation = ['/api/subjects', '/api/interactions', '/api/site-actions', '/api/setup', '/api/connection', '/api/document'].includes(path ?? '') ? path : 'delivery/request';
        const recordFailure = (error) => {
            const failure = sourceFailure(error, operation, observation);
            try {
                onFailure?.(failure);
            }
            catch { }
            return failure;
        };
        // Preserve the finite HTTP observer deadline, but send a truthful outcome
        // rather than resetting a reused socket (browsers may retransmit that POST).
        // This does not cancel an accepted owner action or renew its execution budget.
        const timer = setTimeout(() => {
            if (!response.writableEnded && !response.destroyed) {
                const failure = recordFailure(Object.assign(Error('DeliveryTimedOut'), { code: 'DeliveryTimedOut' }));
                send(response, 504, { error: failure });
            }
            controller.abort();
        }, bounds.bodyMs);
        const work = handle(request, response, controller.signal, observation).catch(error => {
            const failure = recordFailure(error);
            // Read-only diagnostic callback: no inherited preload, payload, credentials or
            // stack. A diagnostic consumer cannot alter the execution branch by throwing.
            if (!response.headersSent && !response.destroyed)
                send(response, 400, { error: failure });
            else if (!response.writableEnded && !response.destroyed)
                response.destroy();
        }).finally(() => {
            try {
                onOutcome?.({ ...observation, operation: observation.operation ?? operation, httpStatus: response.headersSent ? response.statusCode : null });
            }
            catch { }
            clearTimeout(timer);
            response.off('close', abort);
            release();
            controllers.delete(controller);
            inflight.delete(work);
        });
        inflight.add(work);
    });
    server.maxConnections = 32;
    server.maxRequestsPerSocket = 128;
    server.on('upgrade', (request, socket, head) => {
        try {
            if (closing || request.url !== '/api/projection-live' || hub.inspect().connections >= 8)
                fail('SocketUnavailable');
            authorize(request);
            authenticate(request);
            if (request.headers.origin !== origin)
                fail('OriginRequired');
        }
        catch {
            socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\nContent-Length: 0\r\n\r\n');
            return;
        }
        sockets.handleUpgrade(request, socket, head, websocket => {
            const peer = { request: { headers: new Headers() }, websocket, close: (code, reason) => websocket.close(code, reason) };
            requests.set(peer, request);
            websocket.on('message', data => hub.message(peer, Array.isArray(data) ? Buffer.concat(data) : data));
            websocket.on('close', () => hub.disconnect(peer));
            websocket.on('error', () => hub.disconnect(peer));
            hub.open(peer);
        });
    });
    return { server, notify: () => hub.notify(), inspect: () => ({ alive: server.listening, activeRequests: inflight.size, transport: hub.inspect() }),
        async listen() { await new Promise((resolve, reject) => { server.once('error', reject); server.listen(Number(boundary.port), '127.0.0.1', resolve); }); },
        close() {
            if (closePromise)
                return closePromise;
            closing = true;
            // Closing delivery revokes intake and releases transport, not physical work.
            // Let the owning site close its resources BEFORE awaiting its pending calls:
            // their completion may depend on that close. Join one lifecycle promise even
            // for concurrent close callers, and preserve an owner cleanup failure.
            closePromise = Promise.resolve().then(async () => {
                for (const c of controllers)
                    c.abort();
                hub.close();
                for (const ws of sockets.clients)
                    ws.terminate();
                const transportClosed = new Promise(resolve => sockets.close(() => resolve()));
                const httpClosed = new Promise(resolve => server.close(() => resolve()));
                server.closeIdleConnections();
                server.closeAllConnections();
                const ownerClosed = Promise.resolve().then(() => site.close?.());
                const results = await Promise.allSettled([transportClosed, httpClosed, ownerClosed, ...inflight]);
                const failures = results.filter(result => result.status === 'rejected').map(result => result.reason);
                if (failures.length)
                    throw new AggregateError(failures, 'Delivery shutdown failed');
            });
            return closePromise;
        } };
}
