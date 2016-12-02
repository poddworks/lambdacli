import AWS from "aws-sdk";
import fs from "fs";
import inquirer from "inquirer";
import sha1 from "sha1";
import { getLambdarc, pick, prerunCheck } from  "./util";

const cloudwatchevents = new AWS.CloudWatchEvents();
const lambda = new AWS.Lambda();

const config = {};

export function cron(ruleName, opts) {
    prerunCheck(config);

    const questions = [
        {
            type: "input",
            name: "Description",
            message: "Event Description",
            default: config.trigger.Description
        },
        {
            type: "input",
            name: "ScheduleExpression",
            message: "Event schedule pattern",
            default: config.trigger.ScheduleExpression,
            validate: function (input) {
                // TODO: check if matches valid cron pattern
                return (input !== "" ? true : "You must provide a schedule");
            }
        },
        {
            type: "input",
            name: "TargetArn",
            message: "Event trigger target Name or Amazon Resource Name (ARN)",
            default: config.trigger.TargetArn,
            validate: function (input) {
                return (input !== "" ? true : "You must provide a target");
            }
        },
        {
            type: "input",
            name: "RoleArn",
            message: "Event execution Role",
            default: config.trigger.RoleArn,
            validate: function (input) {
                let pass = input.match(/arn:aws:iam::\d{12}:role\/?[a-zA-Z_0-9+=,.@\-_/]+/);
                return (input !== "" ? true : "You must provide a valid IAM role");
            }
        },
        {
            type: "list",
            name: "State",
            message: "Enable/Disable schedule",
            default: config.trigger.State,
            choices: [
                "ENABLED",
                "DISABLED"
            ]
        }
    ];
    inquirer.prompt(questions).then(_cron.bind(null, ruleName, opts));
}

function _cron(ruleName, opts, { Description, TargetArn, RoleArn, ScheduleExpression, State } ) {
    let params = {
        Name: ruleName,
        Description,
        RoleArn,
        ScheduleExpression,
        State
    };

    let thenable = cloudwatchevents.putRule(params).promise();

    thenable = thenable.then(() => {
        let isLambdaArn = TargetArn.match(/arn:aws:lambda:[a-z0-9\-]+:\d{12}:function:\w+/);
        if (isLambdaArn) {
            return TargetArn;
        } else {
            return lambda.getFunction({ FunctionName: TargetArn }).promise().then((data) => data.Configuration.FunctionArn);
        }
    });

    thenable = thenable.then((Arn) => {
        let params = {
            Rule: ruleName,
            Targets: [{
                Arn,
                Id: sha1(Arn)
            }]
        };
        TargetArn = Arn;
        return cloudwatchevents.putTargets(params).promise();
    });

    thenable = thenable.then(() => {
        Object.assign(config.trigger, pick(params, "Description", "RoleArn", "ScheduleExpression", "State"));

        config.trigger.TargetArn = TargetArn;

        config.trigger.RuleName = ruleName;

        fs.writeFileSync(getLambdarc(), JSON.stringify(config, null, "    "));

        return null;
    });

    thenable.catch((err) => console.error(err));
}
