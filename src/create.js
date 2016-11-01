import fs from "fs";
import inquirer from "inquirer";
import shell from "shelljs";
import { Entry, Bootstrap, gulp, gulpLib, gulpLambda, gulpDeploy } from "./template";

const questions = [
    {
        type: "input",
        name: "Description",
        message: "Lambda function Description",
        validate: function (input) {
            return (input !== "" ? true : "You must provide a valid description of this Lambda");
        }
    },
    {
        type: "input",
        name: "Handler",
        message: "Lambda function entrypoint",
        validate: function (input) {
            return (input !== "" ? true : "You must provide a valid entrypoint for Lambda");
        }
    },
    {
        type: "input",
        name: "Role",
        message: "Lambda execution Role",
        validate: function (input) {
            let pass = input.match(/arn:aws:iam::\d{12}:role\/?[a-zA-Z_0-9+=,.@\-_/]+/);
            return (input !== "" ? true : "You must provide a valid IAM role");
        }
    },
    {
        type: "list",
        name: "Runtime",
        message: "Lambda execution Runtime",
        choices: [
            "nodejs",
            "nodejs4.3",
            "java8",
            "python2.7"
        ]
    },
    {
        type: "input",
        name: "Timeout",
        message: "Lambda execution Timeout",
        default: 30,
        validate: function (input) {
            let val = Number(input);
            return (Number.isInteger(val) ? true : "Timeout value must be a Integer");
        },
        filter: Number
    },
    {
        type: "input",
        name: "MemorySize",
        message: "Lambda execution MemorySize Hint",
        default: 128,
        validate: function (input) {
            let val = Number(input);
            return (Number.isInteger(val) ? true : "MemorySize value must be an Integer");
        },
        filter: Number
    }
];

export function create(functionName, opts) {
    inquirer.prompt(questions).then(_create.bind(null, functionName, opts));
}

function _create(functionName, opts, ans) {
    [ "gulp.d", "src" ].forEach((dir) => shell.exec(`mkdir -p ${dir}`));

    fs.writeFileSync(".lambdarc.json", JSON.stringify(_lambdaConfig(functionName, ans), null, "    "));

    fs.writeFileSync("lambda.js", Entry);

    fs.writeFileSync("config.js", _handlerConfig(ans));

    fs.writeFileSync("src/lambda.js", Bootstrap);

    fs.writeFileSync(`src/${ans.Handler}.js`, _handler(ans));

    fs.writeFileSync("gulpfile.js", gulp);

    fs.writeFileSync("gulp.d/gulpfile.lib.js", gulpLib);

    fs.writeFileSync("gulp.d/gulpfile.lambda.js", gulpLambda);

    fs.writeFileSync("gulp.d/gulpfile.deploy.js", gulpDeploy);

    const dependencies = [
        "babel-runtime",
        "dotenv"
    ];
    shell.exec(`npm install --save ${dependencies.join(" ")}`);

    const devDependencies = [
        "babel-plugin-inline-package-json",
        "babel-plugin-minify-dead-code-elimination",
        "babel-plugin-transform-inline-environment-variables",
        "babel-plugin-transform-runtime",
        "babel-preset-es2015",
        "del",
        "gulp",
        "gulp-awslambda",
        "gulp-babel",
        "gulp-rename",
        "gulp-shell",
        "gulp-zip",
        "require-dir"
    ];
    shell.exec(`npm install --save-dev ${devDependencies.join(" ")}`);
}

function _lambdaConfig(functionName, { Description, Handler, Role, Runtime, Timeout, MemorySize }) {
    let dotLambdaRc = {
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
        config: {
            FunctionName: functionName,
            Handler: `lambda.${Handler}`,
            Role,
            Runtime,
            Description,
            MemorySize,
            Timeout
        },
        trigger: {
        }
    };
    return dotLambdaRc;
}

function _handlerConfig({ Handler }) {
    let config = `"use strict"
module.exports = {
    // TODO: for you to configure settings
    tasks: {
        ${Handler}: {}
    }
};
`;
    return config;
}

function _handler({ Handler }) {
    let handler = `export function ${Handler}(event, context, callback) {
    // TODO: for you to implement
    callback(null, "done");
}

export function make(config) {
    // TODO: store configuration and export handler
    return {
        ${Handler}
    };
}
`;
    return handler;
}
