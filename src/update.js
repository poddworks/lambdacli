import fs from "fs";
import inquirer from "inquirer"

const lambdarc = {}

const rc = `${process.cwd()}/.lambdarc.json`;

export function update(opts) {
    Object.assign(lambdarc, require(rc));
    const questions = [
        {
            type: "input",
            name: "Description",
            message: "AWS Lambda function Description",
            default: lambdarc.config.Description
        },
        {
            type: "input",
            name: "Role",
            message: "AWS Lambda execution Role",
            default: lambdarc.config.Role,
            validate: function (input) {
                let pass = input.match(/arn:aws:iam::\d{12}:role\/?[a-zA-Z_0-9+=,.@\-_/]+/);
                return (input !== "" ? true : "You must provide a valid role for Lambda");
            }
        },
        {
            type: "input",
            name: "Timeout",
            message: "AWS Lambda execution Timeout",
            default: lambdarc.config.Timeout,
            validate: function (input) {
                let val = Number(input);
                return (Number.isInteger(val) ? true : "Timeout value must be a Integer");
            },
            filter: Number
        },
        {
            type: "input",
            name: "MemorySize",
            message: "AWS Lambda execution MemorySize Hint",
            default: lambdarc.config.MemorySize,
            validate: function (input) {
                let val = Number(input);
                return (Number.isInteger(val) ? true : "MemorySize value must be an Integer");
            },
            filter: Number
        }
    ];
    inquirer.prompt(questions).then(_update.bind(null, opts));
}

function pick(src, ...fields) {
    let dst = {};
    for (let f of fields) {
        if (f in src) {
            if (src[f] === null || src[f] === undefined || src[f] === "") {
                continue;
            }
            dst[f] = src[f];
        }
    }
    return dst;
}

function _update(opts, ans) {
    Object.assign(lambdarc.config, pick(ans, "Description", "Role", "Timeout", "MemorySize"));

    fs.writeFileSync(rc, JSON.stringify(lambdarc, null, "    "));
}
