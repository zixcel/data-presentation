import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Delivery } from '@zixcel/view-delivery-contracts';
export declare function fail(code: string): never;
export declare const record: (v: unknown) => Record<string, unknown>;
export declare function header(request: IncomingMessage, name: string): string;
export declare const headers: {
    'content-security-policy': string;
    'referrer-policy': string;
    'x-content-type-options': string;
    'x-frame-options': string;
    'permissions-policy': string;
    'cache-control': string;
};
export declare const encode: (value: unknown, maximum?: number) => Buffer<ArrayBuffer>;
export declare function body(request: IncomingMessage, signal: AbortSignal): Promise<unknown>;
export declare function sessionId(request: IncomingMessage, cookieName: string): string;
export declare function safeDocument(envelope: Delivery, bootstrap: unknown, title: string): Buffer<ArrayBuffer>;
export declare function send(response: ServerResponse, status: number, value: unknown): void;
