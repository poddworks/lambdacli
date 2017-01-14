import AWS from "aws-sdk";
import defer from "deferred";

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

export function describeLambdaFunction(functionName) {
    const lambda = new AWS.Lambda();
    return lambda.getFunction({ FunctionName: functionName }).promise();
}
