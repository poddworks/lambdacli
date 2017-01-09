# lambdacli
Build template for AWS Lambda function

## Quickstart
### Init A New Project
```
lambdacli create <project_name>
```

### Add or Update a Lambda Function
```
lambdacli update <function_name>
```

### List available Lambda Functions
```
lambdacli info
```

### Configure Lambda Function Runtime Environment
**TODO**

### Deploy Lambda Function Bundle
- Deploy to **$LATEST** version
```
lambdacli deploy.dev <function_name>
```

- Deploy a new version and associate **prod** alias to version
```
lambdacli deploy.prod <function_name>
```

- Associate a version with an alias
```
lambdacli ref <function_name> --name <alias_name> [--at <version>]
```

## Goal of the project
Produce a framework to write, transpile, and ship AWS Lambda functions as well
as npm ready package for invoking the function by your design.

### What is AWS Lambda?
AWS Lambda is a framework in which you can run and schedule code, without the
need to manage actual computing resources.  AWS Lambda grows and shrinks by
incomiing traffic demand and charge by the amount used (Number of times the
Lambda function had been invoked, and the duration of each execution).

The ability to not managing computing reosurces while still able to schedule
and run server side code has bring the concept of Function As A Service to
production level possibility.

### What is Function As A Service?
With the introduction of micro services people begin to realize that servers
really is just providing a **function** to process *backend resources*.  The
purpose of an *server* really is just an aggregate of many **functions**.

As development cycle decreases, people need to redeploy more often, but the
effort in monitoring and controlling deployment is still rather cost prohibitive
, often times redeploying only for the sake of minor changes.

**FaaS** (Function As A Service) brings redeployment and configuration down to
only necessary components.  Changes can be deployed knowing that the impact
foot print will be small, and roll backs can be rapid.
