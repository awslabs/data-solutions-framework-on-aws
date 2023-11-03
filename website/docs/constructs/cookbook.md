---
sidebar_position: 4
sidebar_label: Construct Cookbook
---

# Best practices for building ADSF constructs

## Tracked Constructs
To measure the number of deployments of the ADSF constructs and get insights about usage, we use CloudFormation descriptions.
The description must contain a tracking code (AWS internal) and a tag for each construct deployed in the stack. It must respect the following format:

```text
Description (uksb_12345abcde) (version:1.2.3) (tag:construct1,construct2)
```

To simplify the creation of this description, we provide a class [`TrackedConstruct`](../../../framework/src/utils/tracked-construct.ts) that you must extend:

```typescript {1,3,7-9,11} showLineNumbers
import { TrackedConstruct, TrackedConstructProps } from '../utils';

export class MyConstruct extends TrackedConstruct {

  constructor(scope: Construct, id: string, props?: MyConstructProps) {

    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: MyConstruct.name,
    };

    super(scope, id, trackedConstructProps);
    
    // construct code...
  }
}
```

:::note

Tracked Construct should be only use on high level constructs. As an example, we apply it to `DataLakeStorage` but not `AnalyticsBucket`.