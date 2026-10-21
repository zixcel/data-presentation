export interface InspectionOverview {
    readonly title: string;
    readonly note: string;
    readonly modulesAvailable: boolean;
    readonly modulesPartial?: boolean;
    readonly groups: readonly {
        readonly id: string;
        readonly title: string;
        readonly note: string;
        readonly state: string;
        readonly measures: readonly {
            readonly unit: string;
            readonly value: number | null;
            readonly partial?: boolean;
            readonly documentId?: string;
        }[];
        readonly values?: readonly string[];
    }[];
    readonly modules: readonly {
        readonly id: string;
        readonly version: string;
        readonly terms: number;
        readonly expressions: number;
        readonly dependencies: readonly string[];
    }[];
}
export declare function inspectionOverview(document: Document, host: HTMLElement, view: InspectionOverview | null, onSource: (id: string) => void, signal: AbortSignal): void;
