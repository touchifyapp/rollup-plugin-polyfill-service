import type { Plugin } from "rollup";
import { createFilter } from "rollup-pluginutils";
import { analyzeBundle } from "./lib/analyzer";
import { BrowsersListOptions, getSupportedBrowsers } from "./lib/browserslist";
import { generatePolyfillURL, GenerateResult } from "./lib/url-generator";

export interface Options {
    /** One or more minimatch patterns */
    include?: Array<string | RegExp> | string | RegExp | null;

    /** One or more minimatch patterns */
    exclude?: Array<string | RegExp> | string | RegExp | null;

    /** Inject URL in given files */
    inject?: string | string[] | InjectOptions;

    /** A custom query or custom options for browserslist resolution. */
    browserslist?: string | BrowsersListOptions;

    /** Print result to the console when builds ends */
    print?: boolean;
}

export interface InjectOptions {
    /** One or more minimatch patterns to HTML files to inject URL in */
    target: string | string[];

    /** The pattern to replace by the polyfill.io URL */
    pattern?: string | RegExp;
}

export default function plugin({ include = "*.js", exclude, inject, browserslist, print }: Options = {}): Plugin {
    let result: GenerateResult;

    return {
        name: "polyfill-service",

        async generateBundle(_, bundle) {
            const filter = createFilter(include, exclude);
            const features = await analyzeBundle(bundle, filter);

            const browsers = getSupportedBrowsers(browserslist);
            result = await generatePolyfillURL(features, browsers);
        },

        writeBundle() {
            if (result && (print || !inject)) {
                if (result.url) {
                    console.log("[polyfill.io] Generated polyfill service URL:");
                    console.log(result.url);
                }
                else {
                    console.log("[polyfill.io] You do not need to use polyfill.io as all your supported browsers support all the features your website currently uses.")
                }
            }
        }
    };
}
