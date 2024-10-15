# rollup-plugin-polyfill-service

[![NPM version](https://img.shields.io/npm/v/rollup-plugin-polyfill-service.svg)](https://www.npmjs.com/package/rollup-plugin-polyfill-service)
[![MIT licensed](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A [rollup](https://rollupjs.org/) plugin for analysing your JavaScript file and generating a https://polyfill.io (new url: https://cdnjs.cloudflare.com/polyfill) URL based on all the features that are being used from within the JavaScript file.

## Installation

```bash
npm install --save-dev rollup-plugin-polyfill-service
```

## Usage

Configure plugin for rollup:

```javascript
import polyfill from "rollup-plugin-polyfill-service";

export default {
    input: "entry.js",
    output: { /* ... */ }
    plugins: [
        // ...

        polyfill({
            inject: "index.html"
        })
    ]
}
```

Add the following line to your `index.html`:

```html
<script src="https://cdnjs.cloudflare.com/polyfill/v3/polyfill.min.js"></script>
```

When running rollup, `rollup-plugin-polyfill-service` will analyze the built bundle, generate a https://cdnjs.cloudflare.com/polyfill URL based on your needs and inject the URL in your `index.html` file.

## Configuration

* `polyfillUrl`: The URL to the polyfill service to generate URL for. *(default: https://cdnjs.cloudflare.com/polyfill/v3/polyfill.min.js)*
* `include`: One or more minimatch patterns. *(default: \*.js)*
* `exclude`: One or more minimatch patterns.
* `inject`: One or more path to html files to inject URL in or an object to control injection:
    * `target`: One or more path to html files to inject URL in.
    * `pattern`: A string or `RegExp` to detect inject location. *(default: `${polyfillUrl}[^"' ]*`)*
* `browserslist`: A browserslist query or an object to pass options to [browserslist]().
    * `query`: A [browserslist query](https://github.com/browserslist/browserslist#queries).
    * `...options`: Any [browserslist options](https://github.com/browserslist/browserslist#js-api).
* `print`: Set to `true` to print the generated URL in the console during build.

## Versioning

We use [SemVer](http://semver.org/) for versioning. 
For the versions available, see the [tags](https://github.com/touchifyapp/rollup-plugin-polyfill-service/tags) on this repository.

## Licence

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.