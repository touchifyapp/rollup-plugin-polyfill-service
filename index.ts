import type { Plugin } from "rollup";
import { createFilter } from "rollup-pluginutils";
import { analyzeBundle } from "./lib/analyzer";
import { BrowsersListOptions, getSupportedBrowsers } from "./lib/browserslist";
import { injectURL, InjectOptions } from "./lib/inject";
import { generatePolyfillURL, GenerateResult } from "./lib/url-generator";

export { InjectOptions };

export interface Options {
    /** Base URL for the polyfill service. */
    polyfillUrl?: string;

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

export default function plugin({
    polyfillUrl = "https://cdnjs.cloudflare.com/polyfill/v3/polyfill.min.js",
    include = "*.js",
    exclude,
    inject,
    browserslist,
    print
}: Options = {}): Plugin {
    let result: GenerateResult;

    return {
        name: "polyfill-service",

        async generateBundle(_, bundle) {
            const filter = createFilter(include, exclude, { resolve: false });
            const features = await analyzeBundle(bundle, filter);

            const browsers = getSupportedBrowsers(browserslist);
            result = await generatePolyfillURL(polyfillUrl, features, browsers);

            if (inject && result.url) {
                await injectURL(polyfillUrl, result.url, inject);
            }
        },

        writeBundle() {
            if (result && (print || !inject)) {
                if (result.url) {
                    console.log();
                    console.log("[polyfill.io] Generated polyfill service URL:");
                    console.log(result.url);
                    console.log();
                }
                else {
                    console.log();
                    console.log("[polyfill.io] You do not need to use polyfill.io as all your supported browsers support all the features your website currently uses.")
                    console.log();
                }
            }
        }
    };
}
