# Template: sam-nodejs-v18

This is a template file for AWS SAM application using NodeJS v18. Additionally, an API Gateway with OpenAPI 3.0.1 is demonstrate here too.

The demostration focuses on how to use the template.

For more information about OpenAPI, do visit the [user guide](https://swagger.io/docs/specification/about/)

## How to use this template

Once you've clone the template, proceed the following steps:
- in `samconfig.toml` replace `${REGION}` and `${PROJECT_NAME}` with a proper stack name such as iam, etc.
- - in `package.json` replace `${PROJECT_NAME}` with AWS project name.
- in `package.json` replace `${AWS_PROFILE}` with AWS Profile name.

## Rules

Some standards are enforce in this template.

### AWS SDK V3

AWS SDK must be **V3 only**.

They are installed with `--save-dev` option only.

### JS Filename

The rules:
- Single JS file must run a single operation. 
- JS filename must be meaningful to what it is for.

For example, there is a need to write codes for writing and fetching of database.
As the results, there will be 2 files:
- write-to-database.js
- fetch-from-database.js

### SAM Function naming convention

The resource name is a Camel-Capital formatted file name.

For example, continuing from above scenario, there will be 2 AWS Lambdas.
```yaml
  WriteToDatabase:
    Type: AWS::Serverless::Function
    Properties: ...

  FetchFromDatabase:
    Type: AWS::Serverless::Function
    Properties: ...
```

To output the resource, add a suffix of what is output-ed. For example, to output above ARNs,

```yaml
Outputs:

  WriteToDatabaseArn:
    Value: !GetAtt WriteToDatabase.Arn
```

### Code boilerplate

At minimum, codes must follow this minimum.

```js
exports.handler = async (event) => {
    if (process.env.NODE_ENV !== 'production') console.log('event', JSON.stringify(event));
    try {

      // code start here
      
    } catch (err) {
        console.error(err, JSON.stringify(event));
        throw err;
    }
}
```

### Use full form for if-else

If-else statement is in full form. Single-liner is `not acceptable`.

```js
  if (valid) {
    // do somehting
  } else {
    // do the alternative
  }
```

### Throw an error

To throw an error, follow the format `ErrorType: Some error message`. 

For example:

```js
throw "BadRequest: Missing some parameters";
```

## Layers

If you install any library in `dependencies`, follow the steps:

1. in `template.yaml` file:
   1. uncomment lines 34 - 43.
   2. replace <INSERT_STACK_NAME> with proper stack name.
   3. uncomment line 55 as needed.
2. in `./src/template.yaml`
   1. uncomment lines 14-15 and 22-23.

## To deploy

To deploy, run the following commands.

```bash
npm install
npm test
npm run prepack
npm run package
npm run deploy:local
```


