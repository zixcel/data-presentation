/** Fail closed unless the exact reviewed upstream source is present. */
export declare function compactThreeShaderSource(source: string): string;
/** esbuild plugin for browser builds. Does not alter source files or runtime APIs. */
export declare function compactThreeShaders(): {
    name: string;
    setup(build: {
        onLoad(options: {
            filter: RegExp;
        }, callback: (args: {
            path: string;
        }) => Promise<{
            contents: string;
            loader: 'js';
        }>): void;
    }): void;
};
