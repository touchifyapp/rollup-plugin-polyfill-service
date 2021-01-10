import * as path from "path";
import { promises as fs } from "fs";
import { tmpdir } from "os";

import * as babel from "@babel/core";
import * as plugin from "@financial-times/js-features-analyser/src/index";

import type { OutputBundle, OutputAsset, OutputChunk } from "rollup";

export async function analyzeBundle(bundle: OutputBundle, filter?: (file: string) => boolean): Promise<string[]> {
    const bundleCode = extractBundleCode(bundle, filter);

    const allResults = await Promise.all(bundleCode.map(([file, code]) => analyze(file, code)));
    const allFeatures = allResults.reduce((res, item) => res.concat(item), []);

    return [...new Set(allFeatures)];
}

export async function analyze(file: string, code: string): Promise<string[]> {
    const tmpFolder = await fs.mkdtemp(path.join(tmpdir(), "features-analyzer"));
    const outputDestination = path.join(tmpFolder, "features.json");

    try {
        babel.transformSync(code, {
            plugins: [
                [
                    plugin,
                    { outputDestination },
                ],
            ],
            filename: file,
            ast: false,
            code: false,
        });

        const features = await fs.readFile(outputDestination, "utf-8");
        return JSON.parse(features);
    }
    finally {
        await fs.rm(tmpFolder, { recursive: true });
    }
}

type BundleCode = [file: string, code: string];

function extractBundleCode(bundle: OutputBundle, filter: (file: string) => boolean = () => true): BundleCode[] {
    return Object.keys(bundle).reduce((res, key) => {
        if (!filter(key)) {
            return res;
        }

        const part = bundle[key];
        if (isOutputChunk(part)) {
            res.push([key, part.code]);
        }

        return res;
    }, [] as BundleCode[]);
}

function isOutputChunk(part?: OutputAsset | OutputChunk): part is OutputChunk {
    return !!part && ("code" in part);
}