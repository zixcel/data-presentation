export function objectPresentation(item: any): {
    form: any;
    dataType?: undefined;
    needsReview?: undefined;
} | {
    form: string;
    dataType: any;
    needsReview: boolean;
};
export const spacingPresets: Readonly<{
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
export const objectForms: Readonly<{
    person: "Person";
    organization: "Organization";
    system: "System";
    shelf: "Bookshelf";
    book: "Book";
}>;
export const libraryLayout: Readonly<{
    columns: 6;
    rows: 4;
    slotWidth: 0.46;
    rowHeight: 0.63;
    baseY: 0.32;
    frontZ: 0.32;
}>;
export const objectBounds: Readonly<{
    person: number[];
    organization: number[];
    system: number[];
    shelf: number[];
    book: number[];
}>;
export const objectTemplates: Readonly<{
    person: (string | number)[][];
    organization: (string | number)[][];
    system: (string | number)[][];
    shelf: (string | number)[][];
    book: (string | number)[][];
}>;
