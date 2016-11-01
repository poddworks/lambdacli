"use strict"

const babel = require("gulp-babel");
const del = require("del");
const gulp = require("gulp");

const dest = {
    dist: "dist"
};
const paths = {
    src: "src/**/*"
};

gulp.task("clean", function () {
    return del([ dest.dist ]);
});

gulp.task("src", function () {
    return gulp.src(paths.src).
        pipe(babel({
            presets: [ "es2015" ],
            plugins: [ "inline-package-json", "transform-runtime" ]
        })).
        pipe(babel({
            plugins: [ "minify-dead-code-elimination" ],
        })).
        pipe(gulp.dest(`${dest.dist}`));
});

gulp.task("default", [ "src" ]);
