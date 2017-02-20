export function generatePackageJSON(functionPrefix) {
    return `{
  "name": "${functionPrefix}",
  "version": "0.0.0",
  "files": [
    "lib",
    "functions.js",
    "LICENSE"
  ],
  "dependencies": {
  },
  "devDependencies": {
  }
}
`
}

export const Entry = `"use strict"
module.exports = require("./lib/lambda").default;
`;

export const Bootstrap = `import config from "../config";
import listing from "../listing";

const Registered = {};

// Go through provided configurations to enable each task
for (let task of listing.tasks) {
    let module = require(\`./worker/\${task}\`);
    Registered[task] = module.default;
}

export default Registered;
`;

export const FunctionEntry = `"use strict"
module.exports = require("./lib/functions");
`;

export const FunctionCore = `// TODO: export functions as required by adding export here
// Implementation should go under ./task/

export {};
`;

export const gulpFile = `"use strict"

require("dotenv").config();
const gulp = require("gulp");
const requireDir = require("require-dir");

requireDir("./gulp.d");

gulp.task("clean", [ "func.clean", "lambda.clean" ]);

gulp.task("default", [ "func", "lambda" ]);

module.exports = gulp;
`;

export const gulpFunc = `"use strict"

const cfg = require("../.lambdarc.json");
const babel = require("gulp-babel");
const del = require("del");
const gulp = require("gulp");

gulp.task("func.clean", function () {
    return del([ cfg.build.dest.func ]);
});

gulp.task("func", function () {
    return gulp.src(cfg.build.paths.func.lib, { dot: true, base: "src/" }).
        pipe(babel({
            presets: [ "es2015" ],
            plugins: [ "inline-package-json", "transform-runtime" ]
        })).
        pipe(babel({
            plugins: [ "minify-dead-code-elimination" ],
        })).
        pipe(gulp.dest(cfg.build.dest.func));
});
`;

export const gulpLambda = `"use strict"

const cfg = require("../.lambdarc.json");
const babel = require("gulp-babel");
const del = require("del");
const gulp = require("gulp");
const shell = require("gulp-shell")
const zip = require("gulp-zip");

gulp.task("lambda.clean", function () {
    return del([ cfg.build.dest.lambda ]);
});

gulp.task("lambda.npm.meta", function () {
    return gulp.src(cfg.build.paths.lambda.meta, { dot: true }).pipe(gulp.dest(cfg.build.dest.lambda));
});

gulp.task("lambda.npm.config", function () {
    return gulp.src(cfg.build.paths.lambda.lib.cfg, { dot: true, base: "src/" }).
        pipe(babel({
            presets: [ "es2015" ],
            plugins: [ "inline-package-json", "transform-inline-environment-variables", "transform-runtime" ]
        })).
        pipe(babel({
            plugins: [ "minify-dead-code-elimination" ],
        })).
        pipe(gulp.dest(cfg.build.dest.lambda + "/lib"));
});

gulp.task("lambda.npm.lib", function () {
    return gulp.src(cfg.build.paths.lambda.lib.src, { dot: true, base: "src/" }).
        pipe(babel({
            presets: [ "es2015" ],
            plugins: [ "inline-package-json", "transform-runtime" ]
        })).
        pipe(babel({
            plugins: [ "minify-dead-code-elimination" ],
        })).
        pipe(gulp.dest(cfg.build.dest.lambda + "/lib"));
});

gulp.task("lambda.npm.src", function () {
    return gulp.src(cfg.build.paths.lambda.src, { dot: true }).
        pipe(babel({
            presets: [ "es2015" ],
            plugins: [ "inline-package-json", "transform-inline-environment-variables", "transform-runtime" ]
        })).
        pipe(babel({
            plugins: [ "minify-dead-code-elimination" ],
        })).
        pipe(gulp.dest(cfg.build.dest.lambda));
});

gulp.task("lambda.npm", [ "lambda.npm.src", "lambda.npm.lib", "lambda.npm.config", "lambda.npm.meta" ], shell.task([
    \`cd \${cfg.build.dest.lambda} && npm install --production\`
]));

gulp.task("lambda", [ "lambda.npm" ], function() {
    return gulp.src([ \`\${cfg.build.dest.lambda}/**/*\`, \`!\${cfg.build.dest.lambda}/app.zip\` ]).pipe(zip("app.zip")).pipe(gulp.dest(cfg.build.dest.lambda));
});

gulp.task("lambda.npm.config.dev", function () {
    return gulp.src(cfg.build.paths.lambda.lib.cfg, { dot: true, base: "src/" }).
        pipe(babel({
            presets: [ "es2015" ],
            plugins: [ "inline-package-json", "transform-runtime" ]
        })).
        pipe(babel({
            plugins: [ "minify-dead-code-elimination" ],
        })).
        pipe(gulp.dest(cfg.build.dest.lambda + "/lib"));
});

gulp.task("lambda.npm.src.dev", function () {
    return gulp.src(cfg.build.paths.lambda.src, { dot: true }).
        pipe(babel({
            presets: [ "es2015" ],
            plugins: [ "inline-package-json", "transform-runtime" ]
        })).
        pipe(babel({
            plugins: [ "minify-dead-code-elimination" ],
        })).
        pipe(gulp.dest(cfg.build.dest.lambda));
});

gulp.task("lambda.npm.dev", [ "lambda.npm.src.dev", "lambda.npm.lib", "lambda.npm.config.dev", "lambda.npm.meta" ], shell.task([
    \`cd \${cfg.build.dest.lambda} && npm install --production\`
]));

gulp.task("lambda.dev", [ "lambda.npm.dev" ], function() {
    return gulp.src([ \`\${cfg.build.dest.lambda}/**/*\`, \`!\${cfg.build.dest.lambda}/app.zip\` ]).pipe(zip("app.zip")).pipe(gulp.dest(cfg.build.dest.lambda));
});
`;

export const gulpDeploy = `"use strict"

const cfg = require("../.lambdarc.json");
const gulp = require("gulp");
const lambda = require("gulp-awslambda");
const stream = require("merge-stream")();

gulp.task("deploy.dev", [ "lambda.dev" ], function () {
    let bundle = gulp.src(\`\${cfg.build.dest.lambda}/app.zip\`);
    let opts = {
        publish: false,
        region: process.env.AWS_REGION || "ap-northeast-1"
    };
    cfg.handler.forEach((config) => {
        console.log(config);
        stream.add(bundle.pipe((lambda(config, opts))));
    });
    return stream;
});

gulp.task("deploy.prod", [ "lambda" ], function () {
    let bundle = gulp.src(\`\${cfg.build.dest.lambda}/app.zip\`);
    let opts = {
        publish: true,
        region: process.env.AWS_REGION || "ap-northeast-1"
    };
    cfg.handler.forEach((config) => {
        console.log(config);
        stream.add(bundle.pipe((lambda(config, opts))));
    });
    return stream;
});
`;

export const gulpDeployOne = function gulpDeployOne(handlerName) {
    return `"use strict"

const cfg = require("../.lambdarc.json");
const gulp = require("gulp");
const lambda = require("gulp-awslambda");
const stream = require("merge-stream")();

gulp.task("deploy.dev.${handlerName}", [ "lambda.dev" ], function () {
    let bundle = gulp.src(\`\${cfg.build.dest.lambda}/app.zip\`);
    let opts = {
        publish: false,
        region: process.env.AWS_REGION || "ap-northeast-1"
    };
    let config = cfg.handler.find((config) => config.Handler === "lambda.${handlerName}");
    stream.add(bundle.pipe((lambda(config, opts))));
    return stream;
});

gulp.task("deploy.prod.${handlerName}", [ "lambda" ] , function () {
    let bundle = gulp.src(\`\${cfg.build.dest.lambda}/app.zip\`);
    let opts = {
        publish: true,
        region: process.env.AWS_REGION || "ap-northeast-1"
    };
    let config = cfg.handler.find((config) => config.Handler === "lambda.${handlerName}");
    stream.add(bundle.pipe((lambda(config, opts))));
    return stream;
});
`;
}
