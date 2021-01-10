import * as polyfillLibrary from "polyfill-library";
import * as UA from "@financial-times/polyfill-useragent-normaliser";
import * as semver from "semver";

export type BrowserFeatureSupport = "supported" | "unsupported" | "unknown";
export type BrowserVersion = { name: string; version: string; };

export interface GenerateResult {
    url?: string;
    browsers: BrowserVersion[];
    featuresReport: Record<string, Record<string, BrowserFeatureSupport>>;
}

export async function generatePolyfillURL(features: string[] = [], supportedBrowsers: string[] = []): Promise<GenerateResult> {
    const browserBaselines = UA.getBaselines();
    const browsers = normaliseBrowsers(supportedBrowsers, browserBaselines);

    const featuresReport: GenerateResult["featuresReport"] = {};
    const featuresInPolyfillLibrary = await normalizeFeatures(features);

    if (browsers.length > 0) {
        for (const feature of featuresInPolyfillLibrary) {
            const featureReport: Record<string, BrowserFeatureSupport> = {};
            const featureConfig = await polyfillLibrary.describePolyfill(feature);
            const browsersWithoutFeature = featureConfig?.browsers ?? {};

            const allSupportedBrowsersSupportFeatureNatively = browsers.every(
                ({ name, version }) => {
                    if (name in browsersWithoutFeature) {
                        const browserRangeWithoutFeature = browsersWithoutFeature[name] as string;
                        if (semver.satisfies(version, browserRangeWithoutFeature)) {
                            featureReport[name] = "unsupported";
                            return false;
                        }
                        else {
                            featureReport[name] = "supported";
                            return true;
                        }
                    }
                    else if (name in browserBaselines) {
                        featureReport[name] = "supported";
                        return true;
                    }
                    else {
                        featureReport[name] = "unknown";
                        return false;
                    }
                }
            );

            if (allSupportedBrowsersSupportFeatureNatively) {
                featuresInPolyfillLibrary.delete(feature);
            }

            featuresReport[feature] = featureReport;
        }
    }

    // Sort array of strings alphabetically
    const sortedFeatures = Array.from(featuresInPolyfillLibrary).sort((a, b) => a.localeCompare(b));

    if (sortedFeatures.length > 0) {
        const url = `https://polyfill.io/v3/polyfill.min.js?features=${sortedFeatures.join(",")}`;
        return { url, browsers, featuresReport }
    }

    return { browsers, featuresReport };
}

async function normalizeFeatures(features: string[]): Promise<Set<string>> {
    const aliases = await polyfillLibrary.listAliases();
    const polyfills = await polyfillLibrary.listAllPolyfills();
    const featuresInPolyfillLibrary = new Set<string>();

    for (const feature of features) {
        if (polyfills.includes(feature)) {
            featuresInPolyfillLibrary.add(feature);
        }
        else if (feature in aliases) {
            featuresInPolyfillLibrary.add(feature);
        }
        else if (feature.includes(".prototype")) {
            const featureConstructor = feature.split(".prototype")[0] as string;
            if (polyfills.includes(featureConstructor)) {
                featuresInPolyfillLibrary.add(featureConstructor);
            }
            else if (featureConstructor in aliases) {
                featuresInPolyfillLibrary.add(featureConstructor);
            }
        }
    }

    for (const [alias, polyfills] of Object.entries(aliases)) {
        if (polyfills.length > 2) {
            const allPolyfillsInAliasAreInFeatures = polyfills.every(polyfill =>
                featuresInPolyfillLibrary.has(polyfill)
            );

            if (allPolyfillsInAliasAreInFeatures) {
                featuresInPolyfillLibrary.add(alias);
                polyfills.forEach(polyfill =>
                    featuresInPolyfillLibrary.delete(polyfill)
                );
            }
        }
    }

    return featuresInPolyfillLibrary;
}

function normaliseBrowsers(browsers: string[], browserBaselines: Record<string, string>): BrowserVersion[] {

    return Array.from(
        new Set(
            browsers.map(b => {
                let [name, range] = b.split(" ");
                if (!name || !range) {
                    throw new Error(`misformatted browser definition: ${b}`);
                }

                name = normalizeBrowserName(name);
                range = normalizeBrowserRange(name, range, browserBaselines);
                const version = normalizeBrowserVersion(range);

                return { name, version };
            })
        )
    );
}

function normalizeBrowserName(name: string): string {
    switch (name) {
        case "and_chr": return "chrome";
        case "and_ff": return "firefox_mob";
        case "samsung": return "samsung_mob";
        default: return name;
    }
}

function normalizeBrowserRange(name: string, range: string, browserBaselines: Record<string, string>): string {
    if (range === "all" || range === "*") {
        const baseRange = browserBaselines[name] || "*";
        return baseRange === "*" ? ">0.0.0" : baseRange;
    }

    return range;
}

function normalizeBrowserVersion(range: string): string {
    const version = semver.coerce(range, { loose: true });
    if (!version) {
        throw new Error(`invalid semver range: ${range}`);
    }

    return version.toString();
}
