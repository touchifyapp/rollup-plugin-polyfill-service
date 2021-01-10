import browserslist, { Options } from "browserslist";

export interface BrowsersListOptions extends Options {
    query?: string;
}

export function getSupportedBrowsers(options?: string | BrowsersListOptions): string[] {
    if (!options) {
        return browserslist();
    }

    if (typeof options === "string") {
        return browserslist(options);
    }

    const { query, ...opts } = options;
    return browserslist(query, opts);
}
