import AWS from "aws-sdk";
import defer from "deferred";
import sha1 from "sha1";

export function listRoles(nextToken, collector = []) {
    const iam = new AWS.IAM();
    let deferred = defer();
    let params = {};
    if (nextToken) {
        params["Marker"] = nextToken;
    }
    iam.listRoles(params, (err, data) => {
        if (err) {
            deferred.reject(err);
        } else {
            collector.push(...(data.Roles.map((role) => role.Arn)));
            if (!data.IsTruncated) {
                deferred.resolve(collector);
            } else {
                deferred.resolve(listRoles(data.Marker, collector));
            }
        }
    });
    return deferred.promise;
}

export function listVpcSecurityGroups() {
    const ec2 = new AWS.EC2();
    return Promise.resolve();
}

export function listVpcSubnets() {
    const ec2 = new AWS.EC2();
    return Promise.resolve();
}

export function updateEventRule({ Name, Description, RoleArn, ScheduleExpression, State }) {
    const cloudwatchevents = new AWS.CloudWatchEvents();
    return cloudwatchevents.putRule({ Name, Description, RoleArn, ScheduleExpression, State }).promise();
}

export function updateEventTargets(Rule, Arn) {
    const cloudwatchevents = new AWS.CloudWatchEvents();
    let params = {
        Rule,
        Targets: [{
            Arn,
            Id: sha1(Arn)
        }]
    };
    return cloudwatchevents.putTargets(params).promise();
}

export function describeLambdaFunction(functionName) {
    const lambda = new AWS.Lambda();
    return lambda.getFunction({ FunctionName: functionName }).promise();
}

export function allowInvokeLambda(functionName, sourceArn) {
    const lambda = new AWS.Lambda();
    let params = {
        Action: "lambda:InvokeFunction",
        FunctionName: functionName,
        Principal: "events.amazonaws.com",
        SourceArn: sourceArn,
        StatementId: sha1(`${functionName}::${sourceArn}`)
    };
    return lambda.addPermission(params).promise();
}
