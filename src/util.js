import fs from "fs";

export function getLambdarc() {
    return `${process.cwd()}/.lambdarc.json`;
}

export function getTaskrc() {
    return `${process.cwd()}/config.js`;
}

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

export function prerunCheck(config, taskcfg) {
    const lambdarc = getLambdarc();
    const taskrc = getTaskrc();
    if (config && fs.existsSync(lambdarc)) {
        Object.assign(config, require(lambdarc));
    } else {
        console.log("You must first create AWS Lambda project");
        process.exit(1);
    }
    if (taskcfg && fs.existsSync(taskrc)) {
        Object.assign(taskcfg, require(taskrc));
    } else {
        console.log("Project configuration error");
        process.exit(2);
    }
}
