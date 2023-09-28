---
sidebar_position: 2
sidebar_label: Getting started
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Getting started

> :heavy_exclamation_mark: If you're new to AWS CDK, we recommend going through a [few basic examples first](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html).

The AWS DSF library is available in Typescript or Python, select the right tab for code examples in your prefered language.

### Create a CDK app
```bash
mkdir adsf-example && cd adsf-example
```

<Tabs>
  <TabItem value="typescript" label="TypeScript" default>
  

  ```bash
  cdk init app --language typescript
  ```
  
  ```mdx-code-block
  </TabItem>
  <TabItem value="python" label="Python">

    ```bash
    cdk init app --language python
    
    # Once you create the app, active the Python virtual environment:

    source .venv/bin/activate
    ```
    
  </TabItem>
</Tabs>

We can now install AWS DSF:

<Tabs>
  <TabItem value="typescript" label="TypeScript" default>
  

  ```bash
  npm i aws-analytics-reference-architecture --save
  ```
  
  ```mdx-code-block
  </TabItem>
  <TabItem value="python" label="Python">

    ```bash
    # Add AWS DSF to requirements.txt
    
    # requirements.txt:
    ...
    aws_data_solutions_framework==1.0.0
    ...

    # Then you can install CDK app requirements:
    python -m pip install -r requirements.txt
    ```
    
  </TabItem>
</Tabs>

### Use AWS DSF to create a data lake storage

We will now use [***DataLakeStorage***](constructs/library/data-lake-storage) to create a storage layer for our data lake on AWS. When we deploy this simple AWS CDK application we will have the following resources created:

![Data lake storage](../../static/img/adsf-data-lake-storage.png)

<Tabs>
  <TabItem value="typescript" label="TypeScript" default>
  
  In `lib/adsf-example-stack.ts`
  ```typescript
  import * as cdk from 'aws-cdk-lib';
  import { DataLakeStorage } from 'aws-data-solutions-framework';

  export class AdsfExampleStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
      super(scope, id, props);

      new DataLakeStorage(stack, 'MyDataLakeStorage', {
        bronzeName: 'my-bronze',
        bronzeInfrequentAccessDelay: 90,
        bronzeArchiveDelay: 180,
        silverName: 'my-silver',
        silverInfrequentAccessDelay: 180,
        silverArchiveDelay: 360,
        goldName: 'my-gold',
        goldInfrequentAccessDelay: 180,
        goldArchiveDelay: 360,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
        dataLakeKey: new Key(stack, 'MyDataLakeKey')
      });
    }
  }

  ```
  
  ```mdx-code-block
  </TabItem>
  <TabItem value="python" label="Python">

    In `adsf_example/adsf_example_stack.py`
    ```python
    import aws_cdk as cdk
    import aws_data_solutions_framework as adsf

    class AdsfExampleStack(cdk.Stack):

      def __init__(self, scope: cdk.App, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        data_lake_storage = adsf.DataLakeStorage(
          self,
          bronze_name="my-bronze",
          bronze_infrequent_access_delay="90",
          bronze_archive_delay="180"
          silver_name="my-silver",
          silver_infrequent_access_delay="180",
          silver_archive_delay="360"
          gold_name="my-gold",
          gold_infrequent_access_delay="180",
          gold_archive_delay="360"
          removal_policy=cdk.RemovalPolicy.RETAIN,
        )
    ```
    
  </TabItem>
</Tabs>

Now you can deploy your stack!
```bash
cdk deploy
```

Congrats, you created your first CDK app using AWS DSF! Go ahead and explore all available [constructs](category/constructs) and [solutions](category/data-solutions).
