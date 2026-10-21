export type ObjectForm = 'person' | 'organization' | 'system' | 'shelf' | 'book';
export type ObjectTint = 'dark' | 'accent' | 'light' | 'face' | 'warning';
export type ObjectPart = readonly [number, number, number, number, number, number, ObjectTint];
export interface PresentationInput {
    id?: string;
    title?: string;
    form?: string;
    kind?: string;
    scalars?: readonly unknown[];
    unresolved?: unknown;
}
export interface ObjectPresentation {
    form: ObjectForm;
    dataType?: 'text' | 'number' | 'boolean' | 'record';
    needsReview?: boolean;
}
export declare const spacingPresets: Readonly<{
    compact: {
        person: number;
        group: number;
        member: number;
    };
    balanced: {
        person: number;
        group: number;
        member: number;
    };
    spacious: {
        person: number;
        group: number;
        member: number;
    };
}>;
export declare const objectForms: Readonly<{
    person: "Person";
    organization: "Organization";
    system: "System";
    shelf: "Bookshelf";
    book: "Book";
}>;
export declare const libraryLayout: Readonly<{
    columns: 6;
    rows: 4;
    slotWidth: 0.46;
    rowHeight: 0.63;
    baseY: 0.32;
    frontZ: 0.32;
}>;
export declare const objectBounds: Readonly<Record<ObjectForm, readonly [number, number, number]>>;
export declare const objectTemplates: Readonly<Record<ObjectForm, readonly ObjectPart[]>>;
export declare function objectPresentation(item: PresentationInput): ObjectPresentation;
