declare module "polyfill-library" {
    export function listAliases(): Record<string, string[]>;
    export function listAllPolyfills(): string[];

    export interface PolyfillDescription {
        spec: string;
        browsers: Record<string, string>;
        detectSource: string;
        baseDir: string;
        hasTests: boolean;
        isTestable: boolean;
        isPublic: boolean;
        size: number;
    }

    export function describePolyfill(feature: string): PolyfillDescription | undefined;
}
