import { promises as fs } from "fs";

export interface InjectOptions {
    /** One or more minimatch patterns to HTML files to inject URL in */
    target: string | string[];

    /** The pattern to replace by the polyfill.io URL */
    pattern?: string | RegExp;
}

export async function injectURL(polyfillUrl: string, generatedUrl: string, options: string | string[] | InjectOptions): Promise<void> {
    if (typeof options === "string" || Array.isArray(options)) {
        options = { target: options };
    }

    const opts = {
        pattern: `${polyfillUrl}[^"' ]*`,
        ...options
    };

    const regex = typeof opts.pattern === "string" ? new RegExp(opts.pattern) : opts.pattern;
    const target = typeof opts.target === "string" ? [opts.target] : opts.target;

    for (const file of target) {
        const content = await fs.readFile(file, "utf-8");
        await fs.writeFile(file, content.replace(regex, generatedUrl));
    }
}