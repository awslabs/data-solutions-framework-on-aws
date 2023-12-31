---
sidebar_position: 1
sidebar_label: Quick start
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';


# Quick start

> :heavy_exclamation_mark: If you're new to AWS CDK, we recommend going through a [few basic examples first](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html).

The DSF on AWS library is available in Typescript or Python, select the right tab for code examples in your preferred language.

### Create a CDK app
```bash
mkdir dsf-example && cd dsf-example
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

We can now install DSF on AWS:

<Tabs>
  <TabItem value="typescript" label="TypeScript" default>
  

  ```bash
  npm i aws-dsf --save
  ```
  
  ```mdx-code-block
  </TabItem>
  <TabItem value="python" label="Python">

    ```bash
    # Add DSF on AWS to requirements.txt
    
    # requirements.txt:
    ...
    aws_dsf==1.0.0
    ...

    # Then you can install CDK app requirements:
    python -m pip install -r requirements.txt
    ```
    
  </TabItem>
</Tabs>

### Use DSF on AWS to create a data lake storage

We will now use [***DataLakeStorage***](constructs/library/02-Storage/03-data-lake-storage.mdx) to create a storage layer for our data lake on AWS. When we deploy this simple AWS CDK application we will have the following resources created:

![Data lake storage](../static/img/adsf-data-lake-storage.png)

<Tabs>
  <TabItem value="typescript" label="TypeScript" default>
  
  In `lib/dsf-example-stack.ts`
  ```typescript
  import * as cdk from 'aws-cdk-lib';
  import { DataLakeStorage } from 'aws-dsf';

  export class DsfExampleStack extends cdk.Stack {
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

    In `dsf_example/dsf_example_stack.py`
    ```python
    import aws_cdk as cdk
    import aws_dsf as dsf

    from constructs import Construct


    class DsfExampleStack(cdk.Stack):

      def __init__(self, scope: cdk.App, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        data_lake_storage = dsf.DataLakeStorage(
          self,
          bronze_name="my-bronze",
          bronze_infrequent_access_delay="90",
          bronze_archive_delay="180",
          silver_name="my-silver",
          silver_infrequent_access_delay="180",
          silver_archive_delay="360",
          gold_name="my-gold",
          gold_infrequent_access_delay="180",
          gold_archive_delay="360",
          removal_policy=cdk.RemovalPolicy.RETAIN,
        )
    ```
    
  </TabItem>
</Tabs>

Now you can deploy your stack!
```bash
cdk deploy
```

Congrats, you created your first CDK app using DSF on AWS! Go ahead and explore all available [constructs](category/constructs) and [examples](category/examples).

