import AWS from "aws-sdk";
import defer from "deferred";

const ec2 = new AWS.EC2();
const iam = new AWS.IAM();

export function listRoles(nextToken, collector = []) {
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
    return Promise.resolve();
}

export function listVpcSubnets() {
    return Promise.resolve();
}
