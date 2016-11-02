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

export function buildConfig(prefix, { Description, Role, Runtime, Timeout, MemorySize }) {
    let dotLambdaRc = {
        build: {
            dest: {
                lib: "lib",
                lambda: "dist"
            },
            paths: {
                lib: [ "src/**/*" ],
                lambda: {
                    lib: "lib/**/*",
                    meta: [ "package.json", ".npmrc", "lambda.js" ],
                    src : [ "config.js" ]
                }
            },
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

export function taskConfig(task = { tasks: {} }) {
    let config = `"use strict"

// Run lambdacli update <handlerName> to enable
module.exports = ${JSON.stringify(task, null, "    ")};
`;
    return config;
}

export function handlerGen(handlerName) {
    let handler = `export function ${handlerName}(event, context, callback) {
    // TODO: for you to implement
    callback(null, "done");
}

export function make(config) {
    // TODO: store configuration and export handler
    return {
        ${handlerName}
    };
}
`;
    return handler;
}
