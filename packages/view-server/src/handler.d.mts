import type { IncomingMessage, ServerResponse } from 'node:http';
import type { DeliveryServerOptions, Observation } from './types.mjs';
import type { Prepared } from './prepare.mjs';
export declare function createHandler(options: DeliveryServerOptions, prepared: Prepared): {
    authorize: (request: IncomingMessage) => void;
    authenticate: (request: IncomingMessage) => string;
    handle: (request: IncomingMessage, response: ServerResponse, signal: AbortSignal, observation: Observation) => Promise<void>;
};
