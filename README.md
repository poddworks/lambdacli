# lambdacli
AWS Lambda function management and deployment tool

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

- Clean and Remove built bundle
```
lambdacli deploy.clean
```

## What does it do
**lambdacli** helps by setting up a workspace ready for
- Create function blueprint to promote best practices
- Bundling application package
- Deploy and/or Attach Version to Alias
- Publishing your *Functions* as an installable package

## Eample use cases
TODO

## Introduction to Function as a Service

### What is Function as a Service?
With the introduction of micro services people begin to realize that servers
really is just providing a **function** to process *backend resources*.  The
purpose of a *server* really is just an aggregate of many **functions**.

As development cycle decreases, people need to redeploy more often, but the
effort in monitoring and controlling deployment is still rather cost prohibitive,
either in time, or in complexity due to dependencies.

**FaaS** (Function as a Service) brings redeployment and configuration down to
only necessary parts, which is the *function* it self.  Changes can be deployed
knowing that the impact foot print will be small, and roll backs can be rapid.

While **FaaS** sounds incredible, the infrastructure required to run such a
dynamic envrionment is harder then micro services.  Enter **AWS Lambda**.

### What is AWS Lambda?
AWS Lambda is a framework in which you can run and schedule code, without the
need to manage actual computing resources.  AWS Lambda grows and shrinks by
incoming traffic demand and charge by the amount used (Number of times the
Lambda function had been invoked, and the duration of each execution).

The ability to not managing computing reosurces while still able to schedule
and run server side code has brought **FaaS** to production grade reliability.
