export const Entry = `"use strict"
module.exports = require("./lib/lambda").bootstrap(require("./config"));
`;

export const Bootstrap = `const Registered = {};

export function bootstrap(config) {
    // Go through provided configurations to enable each task
    for (let task in config.tasks) {
        let module = require(\`./\${task}\`);
        Object.assign(Registered, module.make(config.tasks[task]));
    }
    return Registered;
}
`;

export const gulp = `"use strict"
require("dotenv").config();
const gulp = require("gulp");
const requireDir = require("require-dir");

requireDir("./gulp.d");

gulp.task("clean", [ "lib.clean", "lambda.clean" ]);

gulp.task("default", [ "lib", "lambda" ]);
`;

export const gulpLib = `"use strict"
const cfg = require("../.lambdarc.json");
const babel = require("gulp-babel");
const del = require("del");
const gulp = require("gulp");
gulp.task("lib.clean", function () {
    return del([ cfg.build.dest.lib ]);
});
gulp.task("lib", function () {
    return gulp.src(cfg.build.paths.lib).
        pipe(babel({
            presets: [ "es2015" ],
            plugins: [ "inline-package-json", "transform-runtime" ]
        })).
        pipe(babel({
            plugins: [ "minify-dead-code-elimination" ],
        })).
        pipe(gulp.dest(cfg.build.dest.lib));
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
gulp.task("lambda.npm.lib", [ "lib" ] , function () {
    return gulp.src(cfg.build.paths.lambda.lib, { dot: true }).pipe(gulp.dest(cfg.build.dest.lambda + "/lib"));
});
gulp.task("lambda.npm.meta", function () {
    return gulp.src(cfg.build.paths.lambda.meta, { dot: true }).pipe(gulp.dest(cfg.build.dest.lambda));
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
gulp.task("deploy.dev", function () {
    let params = cfg.config;
    let opts = {
        publish: false,
        region: process.env.AWS_REGION || "ap-northeast-1"
    };
    console.log(params)
    console.log(opts);
    return gulp.src(\`\${cfg.build.dest.lambda}/app.zip\`).pipe(lambda(params, opts));
});
gulp.task("deploy.prod", function () {
    let params = cfg.config;
    let opts = {
        publish: true,
        region: process.env.AWS_REGION || "ap-northeast-1"
    };
    console.log(params)
    console.log(opts);
    return gulp.src(\`\${cfg.build.dest.lambda}/app.zip\`).pipe(lambda(params, opts));
});
`;
