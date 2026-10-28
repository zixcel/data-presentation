export function compactThreeShaderSource(source: string): string;
export function compactThreeShaders(): {
  name: string;
  setup(build: { onLoad(options: { filter: RegExp }, callback: (args: { path: string }) => Promise<{ contents: string; loader: 'js' }>): void }): void;
};
