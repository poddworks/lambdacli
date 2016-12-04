export function generatePackageJSON(functionPrefix) {
    return `{
  "name": "${functionPrefix}",
  "version": "0.0.0",
  "files": [
    "lib",
    "bin",
    "app.js",
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
module.exports = require("./lib/lambda").bootstrap(require("./config"));
`;

export const Bootstrap = `const Registered = {};

export function bootstrap(config) {
    // Go through provided configurations to enable each task
    for (let task in config.tasks) {
        let module = require(\`./worker/\${task}\`);
        Object.assign(Registered, module.make(config.tasks[task]));
    }
    return Registered;
}
`;

export const FunctionEntry = `"use strict"
module.exports = require("./lib/functions");
`;

export const FunctionCore = `// TODO: export functions as required by adding export here
// Implementation should go under ./task/

export {};
`;

export const gulp = `"use strict"

require("dotenv").config();
const gulp = require("gulp");
const requireDir = require("require-dir");

requireDir("./gulp.d");

gulp.task("clean", [ "func.clean", "lambda.clean" ]);

gulp.task("default", [ "func", "lambda" ]);
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

gulp.task("lambda.npm.lib", function () {
    return gulp.src(cfg.build.paths.lambda.lib, { dot: true, base: "src/" }).
        pipe(babel({
            presets: [ "es2015" ],
            plugins: [ "inline-package-json", "transform-runtime" ]
        })).
        pipe(babel({
            plugins: [ "minify-dead-code-elimination" ],
        })).
        pipe(gulp.dest(cfg.build.dest.lambda + "/lib"));
});

gulp.task("lambda.npm.src", [ "lambda.npm.lib", "lambda.npm.meta" ] , function () {
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

gulp.task("lambda.npm", [ "lambda.npm.src" ], shell.task([
    \`cd \${cfg.build.dest.lambda} && npm install --production\`
]));

gulp.task("lambda", [ "lambda.npm" ], function() {
    gulp.src([ \`\${cfg.build.dest.lambda}/**/*\`, \`!\${cfg.build.dest.lambda}/app.zip\` ]).pipe(zip("app.zip")).pipe(gulp.dest(cfg.build.dest.lambda));
});
`;

export const gulpDeploy = `"use strict"

const cfg = require("../.lambdarc.json");
const gulp = require("gulp");
const lambda = require("gulp-awslambda");
const stream = require("merge-stream")();

gulp.task("deploy.dev", function () {
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

gulp.task("deploy.prod", function () {
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
