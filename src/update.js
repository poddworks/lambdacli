import fs from "fs";
import inquirer from "inquirer";
import { getLambda, getListing, handlerGen, pick, prerunCheck, taskListing } from  "./util";
import { gulpDeployOne } from  "./template";
import { listRoles } from "./aws";

const config = {};
const listing = {};

export function update(handlerName, opts) {
    prerunCheck(config, listing);

    let functionName = `${config.lambda.Prefix}-${handlerName}`;

    let idx = config.handler.findIndex((elem) => elem.FunctionName === functionName);
    if (idx === -1) {
        var { Description, Role, Timeout, MemorySize } = config.lambda;
    } else {
        var { Description, Role, Timeout, MemorySize } = config.handler[idx];
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
        config.handler.push(Object.assign({ FunctionName: functionName, Handler: `lambda.${handlerName}` }, settings));
        let { handler, handlerConfig } = handlerGen(handlerName);
        fs.writeFileSync(`src/worker/${handlerName}.js`, handler);
        fs.writeFileSync(`src/worker/${handlerName}_setting.js`, handlerConfig);
        fs.writeFileSync(`gulp.d/gulpfile.${handlerName}.js`, gulpDeployOne(handlerName));
        // Setup config entry for new handler
        listing.tasks.push(handlerName);
        fs.writeFileSync(getListing(), taskListing(listing));
    } else {
        Object.assign(config.handler[idx], settings);
    }
    fs.writeFileSync(getLambda(), JSON.stringify(config, null, "    "));
}
