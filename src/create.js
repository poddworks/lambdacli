import fs from "fs";
import inquirer from "inquirer";
import shell from "shelljs";

import ENV from "./environment";
import { Entry, Bootstrap, FunctionEntry, FunctionCore, generatePackageJSON } from "./template";
import { buildConfig, taskConfig, taskListing } from "./util";
import { gulpFile, gulpFunc, gulpLambda, gulpDeploy } from "./template";
import { listRoles } from "./aws";

export function create(functionPrefix, opts) {
    let resolve = Promise.all([
        listRoles()
    ]);

    resolve = resolve.then(([ roleArns ]) => {
        const questions = [
            {
                type: "input",
                name: "Description",
                message: "Default Lambda function Description",
                validate: function (input) {
                    return (input !== "" ? true : "You must provide a valid description of this Lambda");
                }
            },
            {
                type: "input",
                name: "Region",
                message: "Default Region for AWS resources",
                validate: function (input) {
                    return (input !== "" ? true : "You must provide a valid region");
                }
            },
            {
                type: "list",
                name: "Role",
                message: "Lambda execution Role",
                choices: roleArns
            },
            {
                type: "list",
                name: "Runtime",
                message: "Default Lambda execution Runtime",
                choices: [
                    "nodejs",
                    "nodejs4.3"
                ]
            },
            {
                type: "input",
                name: "Timeout",
                message: "Default Lambda execution Timeout",
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
                message: "Default Lambda execution MemorySize Hint",
                default: 128,
                validate: function (input) {
                    let val = Number(input);
                    return (Number.isInteger(val) ? true : "MemorySize value must be an Integer");
                },
                filter: Number
            }
        ];
        return inquirer.prompt(questions).then(_create.bind(null, functionPrefix, opts));
    });

    resolve.catch((err) => {
        console.log(err);
    });
}

function _create(functionPrefix, opts, ans) {
    [ "gulp.d", "src/worker", "src/task" ].forEach((dir) => shell.exec(`mkdir -p ${dir}`));

    fs.writeFileSync(ENV.lambdarc, buildConfig(functionPrefix, ans));

    fs.writeFileSync(ENV.listingrc, taskListing());

    fs.writeFileSync(ENV.configrc, taskConfig());

    fs.writeFileSync("package.json", generatePackageJSON(functionPrefix));

    fs.writeFileSync("lambda.js", Entry);

    fs.writeFileSync("src/lambda.js", Bootstrap);

    fs.writeFileSync("functions.js", FunctionEntry);

    fs.writeFileSync("src/functions.js", FunctionCore);

    fs.writeFileSync("gulpfile.js", gulpFile);

    fs.writeFileSync("gulp.d/gulpfile.func.js", gulpFunc);

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
        "merge-stream",
        "require-dir"
    ];
    shell.exec(`npm install --save-dev ${devDependencies.join(" ")}`);
}
