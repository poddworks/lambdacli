import fs from "fs";
import inquirer from "inquirer";
import { handlerGen, pick, taskConfig } from  "./util";

const config = {};
const taskcfg = {};

const lambdarc = `${process.cwd()}/.lambdarc.json`;
const taskrc = `${process.cwd()}/config.js`;

export function update(handlerName, opts) {
    if (fs.existsSync(lambdarc)) {
        Object.assign(config, require(lambdarc));
    } else {
        throw new Error("You must first create AWS Lambda project before update");
    }
    if (fs.existsSync(taskrc)) {
        Object.assign(taskcfg, require(taskrc));
    }

    let functionName = `${config.lambda.Prefix}-${handlerName}`;

    let idx = config.handler.findIndex((elem) => elem.FunctionName === functionName);
    if (idx === -1) {
        var { Description, Role, Timeout, MemorySize } = config.lambda;
    } else {
        var { Description, Role, Timeout, MemorySize } = config.handler[idx];
    }

    const questions = [
        {
            type: "input",
            name: "Description",
            message: "Lambda Description",
            default: Description,
        },
        {
            type: "input",
            name: "Role",
            message: "Lambda execution Role",
            default: Role,
            validate: function (input) {
                let pass = input.match(/arn:aws:iam::\d{12}:role\/?[a-zA-Z_0-9+=,.@\-_/]+/);
                return (input !== "" ? true : "You must provide a valid IAM role");
            }
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
    inquirer.prompt(questions).then(_update.bind(null, handlerName, functionName, idx, opts));
}

function _update(handlerName, functionName, idx, opts, ans) {
    let settings = pick(ans, "Description", "Role", "Timeout", "MemorySize");
    if (idx === -1) {
        // Setup handler from default template
        config.handler.push(Object.assign({ FunctionName: functionName, Handler: `lambda.${handlerName}` }, settings));
        fs.writeFileSync(`src/${handlerName}.js`, handlerGen(handlerName));
        // Setup config entry for new handler
        taskcfg.tasks[handlerName] = {};
        fs.writeFileSync(taskrc, taskConfig(taskcfg));
    } else {
        Object.assign(config.handler[idx], settings);
    }
    fs.writeFileSync(lambdarc, JSON.stringify(config, null, "    "));
}
