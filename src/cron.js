import inquirer from "inquirer";
import fs from "fs";

import ENV from "./environment";
import { allowInvokeLambda, describeLambdaFunction, listRoles, updateEventRule, updateEventTargets } from "./aws";
import { pick } from  "./util";

export function cron(ruleName, opts) {
    let Description = undefined,
        RoleArn = undefined,
        ScheduleExpression = undefined,
        FunctionName = undefined,
        State = "ENABLED";

    let idx = ENV.config.trigger.findIndex((elem) => (elem.Name === ruleName));
    if (idx !== -1) {
        ({ Description, FunctionName, ScheduleExpression, State } = ENV.config.trigger[idx]);
    }

    let resolve = Promise.all([
        listRoles()
    ]);

    resolve = resolve.then(([ roleArns ]) => {
        const questions = [
            {
                type: "input",
                name: "Description",
                message: "Event Description",
                default: Description
            },
            {
                type: "input",
                name: "Region",
                message: "Region for AWS Lambda",
                default: ENV.config.aws.region,
                validate: function (input) {
                    return (input !== "" ? true : "You must provide a valid region");
                },
                filter: function (input) {
                    ENV.changeRegion(input);
                    return input;
                }
            },
            {
                type: "list",
                name: "RoleArn",
                message: "Which Role is used for invoking Lambda",
                default: RoleArn,
                choices: roleArns
            },
            {
                type: "input",
                name: "ScheduleExpression",
                message: "Event schedule pattern",
                default: ScheduleExpression,
                validate: function (input) {
                    // TODO: check if matches valid cron pattern
                    return (input !== "" ? true : "You must provide a schedule");
                }
            },
            {
                type: "list",
                name: "FunctionName",
                message: "Lambda function to trigger",
                default: FunctionName,
                choices: ENV.config.handler.map((handler) => (handler.FunctionName))
            },
            {
                type: "list",
                name: "State",
                message: "Enable/Disable schedule",
                default: State,
                choices: [
                    "ENABLED",
                    "DISABLED"
                ]
            }
        ];
        return inquirer.prompt(questions).then(_cron.bind(null, ruleName, idx, opts));
    });

    resolve.catch((err) => {
        console.log(err.message);
    });
}

function _cron(ruleName, idx, opts, ans) {
    let FunctionArn;

    let settings = pick(ans, "Description", "RoleArn", "ScheduleExpression", "State");

    let resolve = describeLambdaFunction(ans.FunctionName);

    resolve = resolve.then(({ Configuration: { FunctionArn: Arn } }) => {
        FunctionArn = Arn;
        return updateEventRule(Object.assign({ Name: ruleName }, settings));
    });

    resolve = resolve.then(({ RuleArn }) => {
        if (idx === -1) {
            return allowInvokeLambda(ans.FunctionName, RuleArn);
        }
        else {
            return Promise.resolve();
        }
    });

    resolve = resolve.then(() => {
        return updateEventTargets(ruleName, FunctionArn);
    });

    resolve = resolve.then(() => {
        if (idx === -1) {
            ENV.config.trigger.push(Object.assign({ Name: ruleName, FunctionName: ans.FunctionName }, settings));
        } else {
            Object.assign(ENV.config.trigger[idx], { FunctionName: ans.FunctionName }, settings);
        }
        fs.writeFileSync(ENV.lambdarc, JSON.stringify(ENV.config, null, "    "));
    });

    return resolve;
}
