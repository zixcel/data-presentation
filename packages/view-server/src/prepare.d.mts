import { Budget } from '@crowsi/transport-foundation';
import { SessionAuthority } from '@crowsi/browser-security/access';
import type { Asset } from '@zixcel/view-delivery-contracts';
import type { DeliveryServerOptions } from './types.mjs';
export declare function prepareDelivery({ origin, assets, policy }: DeliveryServerOptions): {
    boundary: Readonly<import("@crowsi/browser-security/boundary").OwnerOrigin>;
    authority: SessionAuthority;
    budget: Budget;
    assetMap: Map<string, {
        content: Buffer;
        descriptor: Asset;
    }>;
    ownerPolicy: Readonly<{
        cookieName: string;
        csrfHeader: string;
        nonceHeader: string;
        readinessHeader: string;
        owner: string;
        title: string;
        contract: string;
        allowedOwners: readonly any[];
    }>;
};
export type Prepared = ReturnType<typeof prepareDelivery>;
