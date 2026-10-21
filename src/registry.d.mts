import { type ProducerIdentity } from '@zixcel/projection-contracts';
import type { ProducerConfiguration } from './types/runtime.mjs';
import type { ProducerEntry } from './types/jobs.mjs';
export declare class ProducerRegistry {
    #private;
    register({ id, kind, configuration }: {
        id: string;
        kind: 'data' | 'scene';
        configuration?: ProducerConfiguration;
    }): {
        id: string;
        version: string;
        contract: string;
        configuration: string;
    };
    exact(identity: ProducerIdentity): ProducerEntry;
    unregister(identity: ProducerIdentity): void;
    get artifactDigest(): string;
}
