export function pick(src, ...fields) {
    let dst = {};
    for (let f of fields) {
        if (f in src) {
            if (src[f] === null || src[f] === undefined || src[f] === "") {
                continue;
            }
            dst[f] = src[f];
        }
    }
    return dst;
}

export function buildConfig(prefix, { Description, Region, Role, Runtime, Timeout, MemorySize }) {
    let dotLambdaRc = {
        build: {
            dest: {
                func: "lib",
                lambda: "dist"
            },
            paths: {
                func: {
                    lib: [
                        "src/functions.js",
                        "src/task/**/*"
                    ],
                    src: [
                        "functions.js"
                    ]
                },
                lambda: {
                    meta: [
                        "package.json",
                        ".npmrc",
                    ],
                    lib: {
                        src: [
                            "src/lambda.js",
                            "src/worker/**/*.js",
                            "!src/worker/**/*_setting.js"
                        ],
                        cfg: [
                            "src/worker/**/*_setting.js"
                        ]
                    },
                    src: [
                        "config.js",
                        "lambda.js",
                        "listing.js"
                    ]
                }
            }
        },
        aws: {
            region: Region
        },
        lambda: {
            Prefix: prefix,
            Role,
            Runtime,
            Description,
            MemorySize,
            Timeout
        },
        handler: [
            // Nothing
        ],
        trigger: [
            // Nothing
        ]
    };
    return JSON.stringify(dotLambdaRc, null, "    ");
}

export function taskListing(task = { tasks: [] }) {
    let config = `"use strict"

// Global configuration and setup
module.exports = ${JSON.stringify(task, null, "  ")};
`;
    return config;
}

export function taskConfig() {
    let config = `"use strict"

// Global configuration and setup
module.exports = {};
`;
    return config;
}

export function handlerGen(handlerName) {
    let handler = `import config from "../../config";
import setting from "./${handlerName}_setting";

export default function ${handlerName}(event, context, callback) {
    // TODO: for you to implement
    callback(null, "done");
}
`;
    let handlerConfig = `export default {};
`;
    return { handler, handlerConfig };
}
