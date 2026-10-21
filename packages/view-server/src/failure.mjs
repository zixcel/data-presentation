import { requirement } from '@zixcel/view-delivery-contracts';
import { record } from './wire.mjs';
const accessCodes = new Set(['host-rejected', 'origin-rejected', 'origin-required', 'fetch-site-rejected', 'session-capacity-reached', 'session-rejected', 'session-expired', 'csrf-rejected',
    'request-nonce-invalid', 'request-replayed', 'request-nonce-capacity-reached'].map(c => 'crowsi-browser-security-' + c));
const deliveryCodes = new Set(['SessionRejected', 'InvalidInput', 'DeliveryLimitExceeded', 'DeliveryCancelled', 'DeliveryTimedOut', 'InvalidDeliveryData',
    'InvalidAsset', 'NotFound', 'MethodNotAllowed', 'ProjectionCancelled', 'ProjectionRuntimeClosed', 'ProjectionQueueFull',
    'ProjectionStoreBusy', 'ProjectionStoreCorrupt', 'SourceUnavailable', 'SourceNotRetained', 'SourceRevisionMismatch',
    'ProjectionUnavailable', 'ProjectionLimitExceeded', 'ProjectionExecutionTimeout', 'StaleSceneAction', 'SceneUnavailable',
    'InteractionUnavailable', 'InvalidProjection', 'OriginRequired', 'SocketUnavailable']);
function classifyFailure(value, operation, observation) {
    const error = record(value);
    const message = error.message, errorCode = error.code, typed = record(error.failure), typedCode = typed.code;
    const access = typeof message === 'string' && accessCodes.has(message);
    let original = null;
    try {
        original = requirement({ ref: typed.requirementRef, owner: typed.owner, state: 'Unavailable', failure: typed, setup: null }).failure;
    }
    catch { }
    const code = original?.code ?? (access ? String(message) : typeof errorCode === 'string' && deliveryCodes.has(errorCode) ? errorCode :
        typeof typedCode === 'string' && /^[a-z][a-z0-9-]{2,95}$/.test(typedCode) ? typedCode : 'UnhandledDeliveryFault');
    return { code, canonical: { state: observation.receiptRef ? 'Committed' : ['DELIVERY_REJECTED', 'NOT_DISPATCHED'].includes(observation.stage) ? 'NotDispatched' : observation.stage === 'OWNER_REJECTED' ? 'Rejected' : 'Unknown', receiptRef: observation.receiptRef }, ownerFailure: { owner: original?.owner ?? (access ? 'crowsi/browser-security' : observation.owner), operation: original?.operation ?? observation.operation ?? operation,
            code, requirementRef: original?.requirementRef ?? 'delivery:server', outcomeStage: observation.stage, uncertain: observation.stage === 'OUTCOME_UNCERTAIN',
            requestRef: observation.requestRef, managementRequestRef: observation.managementRequestRef ?? null, receiptRef: observation.receiptRef, detail: original?.detail ?? null } };
}
export function sourceFailure(value, operation, observation) {
    try {
        return classifyFailure(value, operation, observation);
    }
    catch {
        return classifyFailure(undefined, operation, observation);
    }
}
