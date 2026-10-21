import type { InputDeclaration } from '@zixcel/interaction/input';
export declare function inputForm(document: Document, declaration: InputDeclaration, onSubmit: (values: Record<string, string | boolean | number>) => unknown | Promise<unknown>): {
    form: HTMLFormElement;
    close(): void;
};
