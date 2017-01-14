import fs from "fs";
import inquirer from "inquirer";

import ENV from "./environment";
import { gulpDeployOne } from  "./template";
import { handlerGen, pick, taskListing } from  "./util";
import { listRoles } from "./aws";

export function update(handlerName, opts) {
    let functionName = `${ENV.config.lambda.Prefix}-${handlerName}`;

    let idx = ENV.config.handler.findIndex((elem) => elem.FunctionName === functionName);
    if (idx === -1) {
        var { Description, Role, Timeout, MemorySize } = ENV.config.lambda;
    } else {
        var { Description, Role, Timeout, MemorySize } = ENV.config.handler[idx];
    }

    let resolve = Promise.all([
        listRoles()
    ]);

    resolve = resolve.then(([ roleArns ]) => {
        const questions = [
            {
                type: "input",
                name: "Description",
                message: "Lambda Description",
                default: Description,
            },
            {
                type: "list",
                name: "Role",
                message: "Lambda execution Role",
                default: Role,
                choices: roleArns
            },
            {
                type: "input",
                name: "Timeout",
                message: "Lambda execution Timeout",
                default: Timeout,
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
                default: MemorySize,
                validate: function (input) {
                    let val = Number(input);
                    return (Number.isInteger(val) ? true : "MemorySize value must be an Integer");
                },
                filter: Number
            }
        ];
        return inquirer.prompt(questions).then(_update.bind(null, handlerName, functionName, idx, opts));
    });

    resolve.catch((err) => {
        console.log(err);
    });
}

function _update(handlerName, functionName, idx, opts, ans) {
    let settings = pick(ans, "Description", "Role", "Timeout", "MemorySize");
    if (idx === -1) {
        // Setup handler from default template
        ENV.config.handler.push(Object.assign({ FunctionName: functionName, Handler: `lambda.${handlerName}` }, settings));
        let { handler, handlerConfig } = handlerGen(handlerName);
        fs.writeFileSync(`src/worker/${handlerName}.js`, handler);
        fs.writeFileSync(`src/worker/${handlerName}_setting.js`, handlerConfig);
        fs.writeFileSync(`gulp.d/gulpfile.${handlerName}.js`, gulpDeployOne(handlerName));
        // Setup config entry for new handler
        ENV.listing.tasks.push(handlerName);
        fs.writeFileSync(ENV.listingrc, taskListing(ENV.listing));
    } else {
        Object.assign(ENV.config.handler[idx], settings);
    }
    fs.writeFileSync(ENV.lambdarc, JSON.stringify(ENV.config, null, "    "));
}
