import path from "path";

import ENV from "./environment";

export function deploy(handlerName, opts) {
    const gulp = require(path.resolve("./gulpfile"));

    function validate() {
        let functionName = `${ENV.config.lambda.Prefix}-${handlerName}`;
        let handler = ENV.config.handler.find((elem) => elem.FunctionName === functionName);
        if (!handler) {
            console.log("AWS Lambda function handler does not exist");
            process.exit(1);
        }
    }

    function clean() {
        gulp.start("clean");
    }

    function dev() {
        validate();
        gulp.start(`deploy.dev.${handlerName}`);
    }

    function prod() {
        validate();
        gulp.start(`deploy.prod.${handlerName}`);
    }

    return { clean, dev, prod };
}
