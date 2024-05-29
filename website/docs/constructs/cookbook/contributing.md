---
sidebar_position: 1
sidebar_label: Contributing to the framework
---

# Contributing to the Framework


This is a TypeScript project managed by the [projen](https://github.com/projen/projen) tool. To contribute to the framework sub project, you need to have the following prerequisites:


### Prerequisites

- Node.js v20
- Yarn
- Docker running locally


### Setup


1. Clone the repository:

    ```bash
    git clone https://github.com/awslabs/data-solutions-framework-on-aws.git
    ```

2. Navigate to the repository directory:

    ```bash
    cd data-solutions-framework-on-aws
    ```

3. Install the project dependencies:

    ```bash
    yarn install
    ````

4. Build the project using projen:

    ```bash
    npx projen build
    ```

Now you're ready to start contributing to the framework sub project!

### Making Changes

1. Create a new branch for your changes:

    ```bash
    git checkout -b feat/my-feature-branch
    ```

2. Make your changes to the code in the framework directory.

3. Build the project again to ensure everything compiles correctly:

    ```bash
    npx projen build
    ```

### Testing changes

1. Validate the changes in an AWS account
   1. Use the following code in a file in the e2e test folder and update corresponding values. **DO NOT COMMIT THIS FILE**

```typescript
    /**
     * Testing my changes
     *
     * @group mytests
     */

    import * as cdk from 'aws-cdk-lib';
    import { TestStack } from './test-stack';

    jest.setTimeout(10000000);

    // GIVEN
    const app = new cdk.App();
    const stack = new Stack(app, 'MyStack');
    const testStack = new TestStack('MskServerkessTestStack', app, stack);

    stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

    // LOGIC TO TEST

    new cdk.CfnOutput(stack, 'MyOutput', {
      value: <OUTPUT_VALUE_TO_TEST>,
    });


    let deployResult: Record<string, string>;


    beforeAll(async() => {
      // WHEN
      deployResult = await testStack.deploy();

    }, 10000000);

    it('mytest', async () => {
      // THEN
      expect(deployResult.MyOutput).toContain('<VALUE_TO_TEST>');
    });

```

   2. Deploy the stack

    ```bash
    cd framework
    npx jest --group=mytests
    ```

    3. Iterate and re-deploy the stack

1. Create/update unit tests. They are required to validate the constructs at the Cloudformation level. Unit tests check the CFN template is matching what is expected. Follow the example of the `DataLakeStorage` [here](https://github.com/awslabs/data-solutions-framework-on-aws/blob/main/framework/test/unit/storage/data-lake-storage.test.ts)
   
   
2. Create/update cdk-nag tests. They are required to validate the CDK code follows AWS Well Architected rules. Follow the example of the `DataLakeStorage` [here](https://github.com/awslabs/data-solutions-framework-on-aws/blob/main/framework/test/unit/nag/storage/nag-data-lake-storage.test.ts). Add exceptions to CDK-nag when:
   1. Errors or warnings are raised on constructs that are not in the scope of the test. For example when encapsulating another construct which is already tested via its own CDK-nag tests.
   2. CDK native resources (provided by CDK itself) are raising errors but it cannot be configured. For example, the CDK custom resource provider has limited configuration and it's not possible to customize the custom resource provider framework itself.
   3. There is no workaround to follow best practices. For example, IAM permissions contains wildcards and can't be scoped down because the resource ID is unknown.

3. Create/update e2e tests. They are required to test the deployment of the construct in an AWS account. Follow the example of the `DataLakeStorage` [here](https://github.com/awslabs/data-solutions-framework-on-aws/blob/main/framework/test/e2e/data-lake-storage.e2e.test.ts)


2. Commit your changes:

    ```bash
    git add .

    git commit -m "My awesome changes"
    ```

3. Push your changes to the remote repository:

    ```bash
    git push origin my-feature-branch
    ```

4. Open a pull request on GitHub for your changes to be reviewed and merged.
