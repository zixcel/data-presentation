import { createHash } from 'node:crypto';
import { Budget, limitsFor } from '@crowsi/transport-foundation';
import { SessionAuthority } from '@crowsi/browser-security/access';
import { parseOwnerOrigin } from '@crowsi/browser-security/boundary';
import { bounds } from '@zixcel/view-delivery-contracts';
import { fail } from './wire.mjs';
const defaultCookieName = 'view_delivery_session';
export function prepareDelivery({ origin, assets, policy }) {
    if (!policy || typeof policy.owner !== 'string' || !policy.owner || policy.owner.length > 128 ||
        typeof policy.contract !== 'string' || !policy.contract || policy.contract.length > 128 || typeof policy.title !== 'string' || !policy.title || policy.title.length > 128 || /[<>&]/.test(policy.title) ||
        !Array.isArray(policy.allowedOwners) || policy.allowedOwners.length > 16 || policy.allowedOwners.some(owner => typeof owner !== 'string' || !owner || owner.length > 128))
        fail('InvalidDeliveryPolicy');
    const headerPolicy = { cookieName: policy.cookieName ?? defaultCookieName, csrfHeader: policy.csrfHeader ?? 'x-delivery-csrf', nonceHeader: policy.nonceHeader ?? 'x-delivery-request-nonce', readinessHeader: policy.readinessHeader ?? 'x-delivery-readiness' };
    if (Object.values(headerPolicy).some(value => typeof value !== 'string' || value.length > 64 || !/[a-z]/.test(value) || !/^[a-z0-9_-]+$/.test(value)))
        fail('InvalidDeliveryPolicy');
    const ownerPolicy = Object.freeze({ owner: policy.owner, title: policy.title, contract: policy.contract, allowedOwners: Object.freeze([...policy.allowedOwners]), ...headerPolicy });
    const boundary = parseOwnerOrigin(origin), authority = new SessionAuthority();
    const budget = new Budget(limitsFor(bounds.documentBytes, { pendingMessages: bounds.requests })), assetMap = new Map();
    for (const asset of assets) {
        const { bytes, ...descriptor } = asset, content = Buffer.from(bytes);
        if (content.length !== descriptor.bytesLength || content.length > bounds.assetBytes)
            fail('InvalidAsset');
        const digest = createHash('sha256').update(content).digest('hex');
        if (digest !== descriptor.digest || assetMap.has(descriptor.path) || !/^\/assets\/[a-zA-Z0-9._-]{1,100}$/.test(descriptor.path) || !['script', 'style'].includes(descriptor.kind))
            fail('InvalidAsset');
        assetMap.set(descriptor.path, { content, descriptor: { path: descriptor.path, digest, bytes: content.length, kind: descriptor.kind } });
    }
    if (assetMap.size < 1 || assetMap.size > bounds.assets)
        fail('InvalidAsset');
    return { boundary, authority, budget, assetMap, ownerPolicy };
}
