# Data solutions framework on AWS


Data solutions framework on AWS (DSF on AWS) is a framework for implementation and delivery of data solutions with built-in AWS best practices. DSF on AWS is an abstraction atop AWS services based on [AWS Cloud Development Kit](https://aws.amazon.com/cdk/) (CDK) L3 constructs, packaged as a library.

➡️ **More information on our [website](https://awslabs.github.io/data-solutions-framework-on-aws)**

# API Reference <a name="API Reference" id="api-reference"></a>

## Constructs <a name="Constructs" id="Constructs"></a>

### AccessLogsBucket <a name="AccessLogsBucket" id="aws-dsf.storage.AccessLogsBucket"></a>

Amazon S3 Bucket configured with best-practices and smart defaults for storing S3 access logs.

Default bucket name is `accesslogs-<AWS_ACCOUNT_ID>-<AWS_REGION>-<UNIQUE_ID>`

> [https://awslabs.github.io/data-solutions-framework-on-aws/docs/constructs/library/access-logs-bucket](https://awslabs.github.io/data-solutions-framework-on-aws/docs/constructs/library/access-logs-bucket)

*Example*

```typescript
const bucket = new dsf.storage.AccessLogsBucket(this, 'AccessLogsBucket', {
 removalPolicy: cdk.RemovalPolicy.DESTROY,
})
```


#### Initializers <a name="Initializers" id="aws-dsf.storage.AccessLogsBucket.Initializer"></a>

```typescript
import { storage } from 'aws-dsf'

new storage.AccessLogsBucket(scope: Construct, id: string, props?: BucketProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | *No description.* |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.Initializer.parameter.props">props</a></code> | <code>aws-cdk-lib.aws_s3.BucketProps</code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="aws-dsf.storage.AccessLogsBucket.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="aws-dsf.storage.AccessLogsBucket.Initializer.parameter.id"></a>

- *Type:* string

---

##### `props`<sup>Optional</sup> <a name="props" id="aws-dsf.storage.AccessLogsBucket.Initializer.parameter.props"></a>

- *Type:* aws-cdk-lib.aws_s3.BucketProps

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.applyRemovalPolicy">applyRemovalPolicy</a></code> | Apply the given removal policy to this resource. |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.addEventNotification">addEventNotification</a></code> | Adds a bucket notification event destination. |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.addObjectCreatedNotification">addObjectCreatedNotification</a></code> | Subscribes a destination to receive notifications when an object is created in the bucket. |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.addObjectRemovedNotification">addObjectRemovedNotification</a></code> | Subscribes a destination to receive notifications when an object is removed from the bucket. |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.addToResourcePolicy">addToResourcePolicy</a></code> | Adds a statement to the resource policy for a principal (i.e. account/role/service) to perform actions on this bucket and/or its contents. Use `bucketArn` and `arnForObjects(keys)` to obtain ARNs for this bucket or objects. |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.arnForObjects">arnForObjects</a></code> | Returns an ARN that represents all objects within the bucket that match the key pattern specified. |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.enableEventBridgeNotification">enableEventBridgeNotification</a></code> | Enables event bridge notification, causing all events below to be sent to EventBridge:. |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.grantDelete">grantDelete</a></code> | Grants s3:DeleteObject* permission to an IAM principal for objects in this bucket. |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.grantPublicAccess">grantPublicAccess</a></code> | Allows unrestricted access to objects from this bucket. |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.grantPut">grantPut</a></code> | Grants s3:PutObject* and s3:Abort* permissions for this bucket to an IAM principal. |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.grantPutAcl">grantPutAcl</a></code> | Grant the given IAM identity permissions to modify the ACLs of objects in the given Bucket. |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.grantRead">grantRead</a></code> | Grant read permissions for this bucket and it's contents to an IAM principal (Role/Group/User). |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.grantReadWrite">grantReadWrite</a></code> | Grants read/write permissions for this bucket and it's contents to an IAM principal (Role/Group/User). |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.grantWrite">grantWrite</a></code> | Grant write permissions to this bucket to an IAM principal. |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.onCloudTrailEvent">onCloudTrailEvent</a></code> | Define a CloudWatch event that triggers when something happens to this repository. |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.onCloudTrailPutObject">onCloudTrailPutObject</a></code> | Defines an AWS CloudWatch event that triggers when an object is uploaded to the specified paths (keys) in this bucket using the PutObject API call. |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.onCloudTrailWriteObject">onCloudTrailWriteObject</a></code> | Defines an AWS CloudWatch event that triggers when an object at the specified paths (keys) in this bucket are written to. |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.s3UrlForObject">s3UrlForObject</a></code> | The S3 URL of an S3 object. For example:. |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.transferAccelerationUrlForObject">transferAccelerationUrlForObject</a></code> | The https Transfer Acceleration URL of an S3 object. |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.urlForObject">urlForObject</a></code> | The https URL of an S3 object. Specify `regional: false` at the options for non-regional URLs. For example:. |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.virtualHostedUrlForObject">virtualHostedUrlForObject</a></code> | The virtual hosted-style URL of an S3 object. Specify `regional: false` at the options for non-regional URL. For example:. |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.addCorsRule">addCorsRule</a></code> | Adds a cross-origin access configuration for objects in an Amazon S3 bucket. |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.addInventory">addInventory</a></code> | Add an inventory configuration. |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.addLifecycleRule">addLifecycleRule</a></code> | Add a lifecycle rule to the bucket. |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.addMetric">addMetric</a></code> | Adds a metrics configuration for the CloudWatch request metrics from the bucket. |

---

##### `toString` <a name="toString" id="aws-dsf.storage.AccessLogsBucket.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `applyRemovalPolicy` <a name="applyRemovalPolicy" id="aws-dsf.storage.AccessLogsBucket.applyRemovalPolicy"></a>

```typescript
public applyRemovalPolicy(policy: RemovalPolicy): void
```

Apply the given removal policy to this resource.

The Removal Policy controls what happens to this resource when it stops
being managed by CloudFormation, either because you've removed it from the
CDK application or because you've made a change that requires the resource
to be replaced.

The resource can be deleted (`RemovalPolicy.DESTROY`), or left in your AWS
account for data recovery and cleanup later (`RemovalPolicy.RETAIN`).

###### `policy`<sup>Required</sup> <a name="policy" id="aws-dsf.storage.AccessLogsBucket.applyRemovalPolicy.parameter.policy"></a>

- *Type:* aws-cdk-lib.RemovalPolicy

---

##### `addEventNotification` <a name="addEventNotification" id="aws-dsf.storage.AccessLogsBucket.addEventNotification"></a>

```typescript
public addEventNotification(event: EventType, dest: IBucketNotificationDestination, filters: NotificationKeyFilter): void
```

Adds a bucket notification event destination.

> [https://docs.aws.amazon.com/AmazonS3/latest/dev/NotificationHowTo.html](https://docs.aws.amazon.com/AmazonS3/latest/dev/NotificationHowTo.html)

*Example*

```typescript
   declare const myLambda: lambda.Function;
   const bucket = new s3.Bucket(this, 'MyBucket');
   bucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(myLambda), {prefix: 'home/myusername/*'});
```


###### `event`<sup>Required</sup> <a name="event" id="aws-dsf.storage.AccessLogsBucket.addEventNotification.parameter.event"></a>

- *Type:* aws-cdk-lib.aws_s3.EventType

The event to trigger the notification.

---

###### `dest`<sup>Required</sup> <a name="dest" id="aws-dsf.storage.AccessLogsBucket.addEventNotification.parameter.dest"></a>

- *Type:* aws-cdk-lib.aws_s3.IBucketNotificationDestination

The notification destination (Lambda, SNS Topic or SQS Queue).

---

###### `filters`<sup>Required</sup> <a name="filters" id="aws-dsf.storage.AccessLogsBucket.addEventNotification.parameter.filters"></a>

- *Type:* aws-cdk-lib.aws_s3.NotificationKeyFilter

S3 object key filter rules to determine which objects trigger this event.

Each filter must include a `prefix` and/or `suffix`
that will be matched against the s3 object key. Refer to the S3 Developer Guide
for details about allowed filter rules.

---

##### `addObjectCreatedNotification` <a name="addObjectCreatedNotification" id="aws-dsf.storage.AccessLogsBucket.addObjectCreatedNotification"></a>

```typescript
public addObjectCreatedNotification(dest: IBucketNotificationDestination, filters: NotificationKeyFilter): void
```

Subscribes a destination to receive notifications when an object is created in the bucket.

This is identical to calling
`onEvent(EventType.OBJECT_CREATED)`.

###### `dest`<sup>Required</sup> <a name="dest" id="aws-dsf.storage.AccessLogsBucket.addObjectCreatedNotification.parameter.dest"></a>

- *Type:* aws-cdk-lib.aws_s3.IBucketNotificationDestination

The notification destination (see onEvent).

---

###### `filters`<sup>Required</sup> <a name="filters" id="aws-dsf.storage.AccessLogsBucket.addObjectCreatedNotification.parameter.filters"></a>

- *Type:* aws-cdk-lib.aws_s3.NotificationKeyFilter

Filters (see onEvent).

---

##### `addObjectRemovedNotification` <a name="addObjectRemovedNotification" id="aws-dsf.storage.AccessLogsBucket.addObjectRemovedNotification"></a>

```typescript
public addObjectRemovedNotification(dest: IBucketNotificationDestination, filters: NotificationKeyFilter): void
```

Subscribes a destination to receive notifications when an object is removed from the bucket.

This is identical to calling
`onEvent(EventType.OBJECT_REMOVED)`.

###### `dest`<sup>Required</sup> <a name="dest" id="aws-dsf.storage.AccessLogsBucket.addObjectRemovedNotification.parameter.dest"></a>

- *Type:* aws-cdk-lib.aws_s3.IBucketNotificationDestination

The notification destination (see onEvent).

---

###### `filters`<sup>Required</sup> <a name="filters" id="aws-dsf.storage.AccessLogsBucket.addObjectRemovedNotification.parameter.filters"></a>

- *Type:* aws-cdk-lib.aws_s3.NotificationKeyFilter

Filters (see onEvent).

---

##### `addToResourcePolicy` <a name="addToResourcePolicy" id="aws-dsf.storage.AccessLogsBucket.addToResourcePolicy"></a>

```typescript
public addToResourcePolicy(permission: PolicyStatement): AddToResourcePolicyResult
```

Adds a statement to the resource policy for a principal (i.e. account/role/service) to perform actions on this bucket and/or its contents. Use `bucketArn` and `arnForObjects(keys)` to obtain ARNs for this bucket or objects.

Note that the policy statement may or may not be added to the policy.
For example, when an `IBucket` is created from an existing bucket,
it's not possible to tell whether the bucket already has a policy
attached, let alone to re-use that policy to add more statements to it.
So it's safest to do nothing in these cases.

###### `permission`<sup>Required</sup> <a name="permission" id="aws-dsf.storage.AccessLogsBucket.addToResourcePolicy.parameter.permission"></a>

- *Type:* aws-cdk-lib.aws_iam.PolicyStatement

the policy statement to be added to the bucket's policy.

---

##### `arnForObjects` <a name="arnForObjects" id="aws-dsf.storage.AccessLogsBucket.arnForObjects"></a>

```typescript
public arnForObjects(keyPattern: string): string
```

Returns an ARN that represents all objects within the bucket that match the key pattern specified.

To represent all keys, specify ``"*"``.

If you need to specify a keyPattern with multiple components, concatenate them into a single string, e.g.:

  arnForObjects(`home/${team}/${user}/*`)

###### `keyPattern`<sup>Required</sup> <a name="keyPattern" id="aws-dsf.storage.AccessLogsBucket.arnForObjects.parameter.keyPattern"></a>

- *Type:* string

---

##### `enableEventBridgeNotification` <a name="enableEventBridgeNotification" id="aws-dsf.storage.AccessLogsBucket.enableEventBridgeNotification"></a>

```typescript
public enableEventBridgeNotification(): void
```

Enables event bridge notification, causing all events below to be sent to EventBridge:.

Object Deleted (DeleteObject)
- Object Deleted (Lifecycle expiration)
- Object Restore Initiated
- Object Restore Completed
- Object Restore Expired
- Object Storage Class Changed
- Object Access Tier Changed
- Object ACL Updated
- Object Tags Added
- Object Tags Deleted

##### `grantDelete` <a name="grantDelete" id="aws-dsf.storage.AccessLogsBucket.grantDelete"></a>

```typescript
public grantDelete(identity: IGrantable, objectsKeyPattern?: any): Grant
```

Grants s3:DeleteObject* permission to an IAM principal for objects in this bucket.

###### `identity`<sup>Required</sup> <a name="identity" id="aws-dsf.storage.AccessLogsBucket.grantDelete.parameter.identity"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

The principal.

---

###### `objectsKeyPattern`<sup>Optional</sup> <a name="objectsKeyPattern" id="aws-dsf.storage.AccessLogsBucket.grantDelete.parameter.objectsKeyPattern"></a>

- *Type:* any

Restrict the permission to a certain key pattern (default '*').

Parameter type is `any` but `string` should be passed in.

---

##### `grantPublicAccess` <a name="grantPublicAccess" id="aws-dsf.storage.AccessLogsBucket.grantPublicAccess"></a>

```typescript
public grantPublicAccess(allowedActions: string, keyPrefix?: string): Grant
```

Allows unrestricted access to objects from this bucket.

IMPORTANT: This permission allows anyone to perform actions on S3 objects
in this bucket, which is useful for when you configure your bucket as a
website and want everyone to be able to read objects in the bucket without
needing to authenticate.

Without arguments, this method will grant read ("s3:GetObject") access to
all objects ("*") in the bucket.

The method returns the `iam.Grant` object, which can then be modified
as needed. For example, you can add a condition that will restrict access only
to an IPv4 range like this:

    const grant = bucket.grantPublicAccess();
    grant.resourceStatement!.addCondition(‘IpAddress’, { “aws:SourceIp”: “54.240.143.0/24” });

Note that if this `IBucket` refers to an existing bucket, possibly not
managed by CloudFormation, this method will have no effect, since it's
impossible to modify the policy of an existing bucket.

###### `allowedActions`<sup>Required</sup> <a name="allowedActions" id="aws-dsf.storage.AccessLogsBucket.grantPublicAccess.parameter.allowedActions"></a>

- *Type:* string

the set of S3 actions to allow.

Default is "s3:GetObject".

---

###### `keyPrefix`<sup>Optional</sup> <a name="keyPrefix" id="aws-dsf.storage.AccessLogsBucket.grantPublicAccess.parameter.keyPrefix"></a>

- *Type:* string

the prefix of S3 object keys (e.g. `home/*`). Default is "*".

---

##### `grantPut` <a name="grantPut" id="aws-dsf.storage.AccessLogsBucket.grantPut"></a>

```typescript
public grantPut(identity: IGrantable, objectsKeyPattern?: any): Grant
```

Grants s3:PutObject* and s3:Abort* permissions for this bucket to an IAM principal.

If encryption is used, permission to use the key to encrypt the contents
of written files will also be granted to the same principal.

###### `identity`<sup>Required</sup> <a name="identity" id="aws-dsf.storage.AccessLogsBucket.grantPut.parameter.identity"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

The principal.

---

###### `objectsKeyPattern`<sup>Optional</sup> <a name="objectsKeyPattern" id="aws-dsf.storage.AccessLogsBucket.grantPut.parameter.objectsKeyPattern"></a>

- *Type:* any

Restrict the permission to a certain key pattern (default '*').

Parameter type is `any` but `string` should be passed in.

---

##### `grantPutAcl` <a name="grantPutAcl" id="aws-dsf.storage.AccessLogsBucket.grantPutAcl"></a>

```typescript
public grantPutAcl(identity: IGrantable, objectsKeyPattern?: string): Grant
```

Grant the given IAM identity permissions to modify the ACLs of objects in the given Bucket.

If your application has the '@aws-cdk/aws-s3:grantWriteWithoutAcl' feature flag set,
calling `grantWrite` or `grantReadWrite` no longer grants permissions to modify the ACLs of the objects;
in this case, if you need to modify object ACLs, call this method explicitly.

###### `identity`<sup>Required</sup> <a name="identity" id="aws-dsf.storage.AccessLogsBucket.grantPutAcl.parameter.identity"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

---

###### `objectsKeyPattern`<sup>Optional</sup> <a name="objectsKeyPattern" id="aws-dsf.storage.AccessLogsBucket.grantPutAcl.parameter.objectsKeyPattern"></a>

- *Type:* string

---

##### `grantRead` <a name="grantRead" id="aws-dsf.storage.AccessLogsBucket.grantRead"></a>

```typescript
public grantRead(identity: IGrantable, objectsKeyPattern?: any): Grant
```

Grant read permissions for this bucket and it's contents to an IAM principal (Role/Group/User).

If encryption is used, permission to use the key to decrypt the contents
of the bucket will also be granted to the same principal.

###### `identity`<sup>Required</sup> <a name="identity" id="aws-dsf.storage.AccessLogsBucket.grantRead.parameter.identity"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

The principal.

---

###### `objectsKeyPattern`<sup>Optional</sup> <a name="objectsKeyPattern" id="aws-dsf.storage.AccessLogsBucket.grantRead.parameter.objectsKeyPattern"></a>

- *Type:* any

Restrict the permission to a certain key pattern (default '*').

Parameter type is `any` but `string` should be passed in.

---

##### `grantReadWrite` <a name="grantReadWrite" id="aws-dsf.storage.AccessLogsBucket.grantReadWrite"></a>

```typescript
public grantReadWrite(identity: IGrantable, objectsKeyPattern?: any): Grant
```

Grants read/write permissions for this bucket and it's contents to an IAM principal (Role/Group/User).

If an encryption key is used, permission to use the key for
encrypt/decrypt will also be granted.

Before CDK version 1.85.0, this method granted the `s3:PutObject*` permission that included `s3:PutObjectAcl`,
which could be used to grant read/write object access to IAM principals in other accounts.
If you want to get rid of that behavior, update your CDK version to 1.85.0 or later,
and make sure the `@aws-cdk/aws-s3:grantWriteWithoutAcl` feature flag is set to `true`
in the `context` key of your cdk.json file.
If you've already updated, but still need the principal to have permissions to modify the ACLs,
use the `grantPutAcl` method.

###### `identity`<sup>Required</sup> <a name="identity" id="aws-dsf.storage.AccessLogsBucket.grantReadWrite.parameter.identity"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

---

###### `objectsKeyPattern`<sup>Optional</sup> <a name="objectsKeyPattern" id="aws-dsf.storage.AccessLogsBucket.grantReadWrite.parameter.objectsKeyPattern"></a>

- *Type:* any

---

##### `grantWrite` <a name="grantWrite" id="aws-dsf.storage.AccessLogsBucket.grantWrite"></a>

```typescript
public grantWrite(identity: IGrantable, objectsKeyPattern?: any, allowedActionPatterns?: string[]): Grant
```

Grant write permissions to this bucket to an IAM principal.

If encryption is used, permission to use the key to encrypt the contents
of written files will also be granted to the same principal.

Before CDK version 1.85.0, this method granted the `s3:PutObject*` permission that included `s3:PutObjectAcl`,
which could be used to grant read/write object access to IAM principals in other accounts.
If you want to get rid of that behavior, update your CDK version to 1.85.0 or later,
and make sure the `@aws-cdk/aws-s3:grantWriteWithoutAcl` feature flag is set to `true`
in the `context` key of your cdk.json file.
If you've already updated, but still need the principal to have permissions to modify the ACLs,
use the `grantPutAcl` method.

###### `identity`<sup>Required</sup> <a name="identity" id="aws-dsf.storage.AccessLogsBucket.grantWrite.parameter.identity"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

---

###### `objectsKeyPattern`<sup>Optional</sup> <a name="objectsKeyPattern" id="aws-dsf.storage.AccessLogsBucket.grantWrite.parameter.objectsKeyPattern"></a>

- *Type:* any

---

###### `allowedActionPatterns`<sup>Optional</sup> <a name="allowedActionPatterns" id="aws-dsf.storage.AccessLogsBucket.grantWrite.parameter.allowedActionPatterns"></a>

- *Type:* string[]

---

##### `onCloudTrailEvent` <a name="onCloudTrailEvent" id="aws-dsf.storage.AccessLogsBucket.onCloudTrailEvent"></a>

```typescript
public onCloudTrailEvent(id: string, options?: OnCloudTrailBucketEventOptions): Rule
```

Define a CloudWatch event that triggers when something happens to this repository.

Requires that there exists at least one CloudTrail Trail in your account
that captures the event. This method will not create the Trail.

###### `id`<sup>Required</sup> <a name="id" id="aws-dsf.storage.AccessLogsBucket.onCloudTrailEvent.parameter.id"></a>

- *Type:* string

The id of the rule.

---

###### `options`<sup>Optional</sup> <a name="options" id="aws-dsf.storage.AccessLogsBucket.onCloudTrailEvent.parameter.options"></a>

- *Type:* aws-cdk-lib.aws_s3.OnCloudTrailBucketEventOptions

Options for adding the rule.

---

##### `onCloudTrailPutObject` <a name="onCloudTrailPutObject" id="aws-dsf.storage.AccessLogsBucket.onCloudTrailPutObject"></a>

```typescript
public onCloudTrailPutObject(id: string, options?: OnCloudTrailBucketEventOptions): Rule
```

Defines an AWS CloudWatch event that triggers when an object is uploaded to the specified paths (keys) in this bucket using the PutObject API call.

Note that some tools like `aws s3 cp` will automatically use either
PutObject or the multipart upload API depending on the file size,
so using `onCloudTrailWriteObject` may be preferable.

Requires that there exists at least one CloudTrail Trail in your account
that captures the event. This method will not create the Trail.

###### `id`<sup>Required</sup> <a name="id" id="aws-dsf.storage.AccessLogsBucket.onCloudTrailPutObject.parameter.id"></a>

- *Type:* string

The id of the rule.

---

###### `options`<sup>Optional</sup> <a name="options" id="aws-dsf.storage.AccessLogsBucket.onCloudTrailPutObject.parameter.options"></a>

- *Type:* aws-cdk-lib.aws_s3.OnCloudTrailBucketEventOptions

Options for adding the rule.

---

##### `onCloudTrailWriteObject` <a name="onCloudTrailWriteObject" id="aws-dsf.storage.AccessLogsBucket.onCloudTrailWriteObject"></a>

```typescript
public onCloudTrailWriteObject(id: string, options?: OnCloudTrailBucketEventOptions): Rule
```

Defines an AWS CloudWatch event that triggers when an object at the specified paths (keys) in this bucket are written to.

This includes
the events PutObject, CopyObject, and CompleteMultipartUpload.

Note that some tools like `aws s3 cp` will automatically use either
PutObject or the multipart upload API depending on the file size,
so using this method may be preferable to `onCloudTrailPutObject`.

Requires that there exists at least one CloudTrail Trail in your account
that captures the event. This method will not create the Trail.

###### `id`<sup>Required</sup> <a name="id" id="aws-dsf.storage.AccessLogsBucket.onCloudTrailWriteObject.parameter.id"></a>

- *Type:* string

The id of the rule.

---

###### `options`<sup>Optional</sup> <a name="options" id="aws-dsf.storage.AccessLogsBucket.onCloudTrailWriteObject.parameter.options"></a>

- *Type:* aws-cdk-lib.aws_s3.OnCloudTrailBucketEventOptions

Options for adding the rule.

---

##### `s3UrlForObject` <a name="s3UrlForObject" id="aws-dsf.storage.AccessLogsBucket.s3UrlForObject"></a>

```typescript
public s3UrlForObject(key?: string): string
```

The S3 URL of an S3 object. For example:.

`s3://onlybucket`
- `s3://bucket/key`

###### `key`<sup>Optional</sup> <a name="key" id="aws-dsf.storage.AccessLogsBucket.s3UrlForObject.parameter.key"></a>

- *Type:* string

The S3 key of the object.

If not specified, the S3 URL of the
bucket is returned.

---

##### `transferAccelerationUrlForObject` <a name="transferAccelerationUrlForObject" id="aws-dsf.storage.AccessLogsBucket.transferAccelerationUrlForObject"></a>

```typescript
public transferAccelerationUrlForObject(key?: string, options?: TransferAccelerationUrlOptions): string
```

The https Transfer Acceleration URL of an S3 object.

Specify `dualStack: true` at the options
for dual-stack endpoint (connect to the bucket over IPv6). For example:

- `https://bucket.s3-accelerate.amazonaws.com`
- `https://bucket.s3-accelerate.amazonaws.com/key`

###### `key`<sup>Optional</sup> <a name="key" id="aws-dsf.storage.AccessLogsBucket.transferAccelerationUrlForObject.parameter.key"></a>

- *Type:* string

The S3 key of the object.

If not specified, the URL of the
bucket is returned.

---

###### `options`<sup>Optional</sup> <a name="options" id="aws-dsf.storage.AccessLogsBucket.transferAccelerationUrlForObject.parameter.options"></a>

- *Type:* aws-cdk-lib.aws_s3.TransferAccelerationUrlOptions

Options for generating URL.

---

##### `urlForObject` <a name="urlForObject" id="aws-dsf.storage.AccessLogsBucket.urlForObject"></a>

```typescript
public urlForObject(key?: string): string
```

The https URL of an S3 object. Specify `regional: false` at the options for non-regional URLs. For example:.

`https://s3.us-west-1.amazonaws.com/onlybucket`
- `https://s3.us-west-1.amazonaws.com/bucket/key`
- `https://s3.cn-north-1.amazonaws.com.cn/china-bucket/mykey`

###### `key`<sup>Optional</sup> <a name="key" id="aws-dsf.storage.AccessLogsBucket.urlForObject.parameter.key"></a>

- *Type:* string

The S3 key of the object.

If not specified, the URL of the
bucket is returned.

---

##### `virtualHostedUrlForObject` <a name="virtualHostedUrlForObject" id="aws-dsf.storage.AccessLogsBucket.virtualHostedUrlForObject"></a>

```typescript
public virtualHostedUrlForObject(key?: string, options?: VirtualHostedStyleUrlOptions): string
```

The virtual hosted-style URL of an S3 object. Specify `regional: false` at the options for non-regional URL. For example:.

`https://only-bucket.s3.us-west-1.amazonaws.com`
- `https://bucket.s3.us-west-1.amazonaws.com/key`
- `https://bucket.s3.amazonaws.com/key`
- `https://china-bucket.s3.cn-north-1.amazonaws.com.cn/mykey`

###### `key`<sup>Optional</sup> <a name="key" id="aws-dsf.storage.AccessLogsBucket.virtualHostedUrlForObject.parameter.key"></a>

- *Type:* string

The S3 key of the object.

If not specified, the URL of the
bucket is returned.

---

###### `options`<sup>Optional</sup> <a name="options" id="aws-dsf.storage.AccessLogsBucket.virtualHostedUrlForObject.parameter.options"></a>

- *Type:* aws-cdk-lib.aws_s3.VirtualHostedStyleUrlOptions

Options for generating URL.

---

##### `addCorsRule` <a name="addCorsRule" id="aws-dsf.storage.AccessLogsBucket.addCorsRule"></a>

```typescript
public addCorsRule(rule: CorsRule): void
```

Adds a cross-origin access configuration for objects in an Amazon S3 bucket.

###### `rule`<sup>Required</sup> <a name="rule" id="aws-dsf.storage.AccessLogsBucket.addCorsRule.parameter.rule"></a>

- *Type:* aws-cdk-lib.aws_s3.CorsRule

The CORS configuration rule to add.

---

##### `addInventory` <a name="addInventory" id="aws-dsf.storage.AccessLogsBucket.addInventory"></a>

```typescript
public addInventory(inventory: Inventory): void
```

Add an inventory configuration.

###### `inventory`<sup>Required</sup> <a name="inventory" id="aws-dsf.storage.AccessLogsBucket.addInventory.parameter.inventory"></a>

- *Type:* aws-cdk-lib.aws_s3.Inventory

configuration to add.

---

##### `addLifecycleRule` <a name="addLifecycleRule" id="aws-dsf.storage.AccessLogsBucket.addLifecycleRule"></a>

```typescript
public addLifecycleRule(rule: LifecycleRule): void
```

Add a lifecycle rule to the bucket.

###### `rule`<sup>Required</sup> <a name="rule" id="aws-dsf.storage.AccessLogsBucket.addLifecycleRule.parameter.rule"></a>

- *Type:* aws-cdk-lib.aws_s3.LifecycleRule

The rule to add.

---

##### `addMetric` <a name="addMetric" id="aws-dsf.storage.AccessLogsBucket.addMetric"></a>

```typescript
public addMetric(metric: BucketMetrics): void
```

Adds a metrics configuration for the CloudWatch request metrics from the bucket.

###### `metric`<sup>Required</sup> <a name="metric" id="aws-dsf.storage.AccessLogsBucket.addMetric.parameter.metric"></a>

- *Type:* aws-cdk-lib.aws_s3.BucketMetrics

The metric configuration to add.

---

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.isOwnedResource">isOwnedResource</a></code> | Returns true if the construct was created by CDK, and false otherwise. |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.isResource">isResource</a></code> | Check whether the given construct is a Resource. |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.fromBucketArn">fromBucketArn</a></code> | *No description.* |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.fromBucketAttributes">fromBucketAttributes</a></code> | Creates a Bucket construct that represents an external bucket. |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.fromBucketName">fromBucketName</a></code> | *No description.* |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.fromCfnBucket">fromCfnBucket</a></code> | Create a mutable `IBucket` based on a low-level `CfnBucket`. |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.validateBucketName">validateBucketName</a></code> | Thrown an exception if the given bucket name is not valid. |

---

##### `isConstruct` <a name="isConstruct" id="aws-dsf.storage.AccessLogsBucket.isConstruct"></a>

```typescript
import { storage } from 'aws-dsf'

storage.AccessLogsBucket.isConstruct(x: any)
```

Checks if `x` is a construct.

Use this method instead of `instanceof` to properly detect `Construct`
instances, even when the construct library is symlinked.

Explanation: in JavaScript, multiple copies of the `constructs` library on
disk are seen as independent, completely different libraries. As a
consequence, the class `Construct` in each copy of the `constructs` library
is seen as a different class, and an instance of one class will not test as
`instanceof` the other class. `npm install` will not create installations
like this, but users may manually symlink construct libraries together or
use a monorepo tool: in those cases, multiple copies of the `constructs`
library can be accidentally installed, and `instanceof` will behave
unpredictably. It is safest to avoid using `instanceof`, and using
this type-testing method instead.

###### `x`<sup>Required</sup> <a name="x" id="aws-dsf.storage.AccessLogsBucket.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

##### `isOwnedResource` <a name="isOwnedResource" id="aws-dsf.storage.AccessLogsBucket.isOwnedResource"></a>

```typescript
import { storage } from 'aws-dsf'

storage.AccessLogsBucket.isOwnedResource(construct: IConstruct)
```

Returns true if the construct was created by CDK, and false otherwise.

###### `construct`<sup>Required</sup> <a name="construct" id="aws-dsf.storage.AccessLogsBucket.isOwnedResource.parameter.construct"></a>

- *Type:* constructs.IConstruct

---

##### `isResource` <a name="isResource" id="aws-dsf.storage.AccessLogsBucket.isResource"></a>

```typescript
import { storage } from 'aws-dsf'

storage.AccessLogsBucket.isResource(construct: IConstruct)
```

Check whether the given construct is a Resource.

###### `construct`<sup>Required</sup> <a name="construct" id="aws-dsf.storage.AccessLogsBucket.isResource.parameter.construct"></a>

- *Type:* constructs.IConstruct

---

##### `fromBucketArn` <a name="fromBucketArn" id="aws-dsf.storage.AccessLogsBucket.fromBucketArn"></a>

```typescript
import { storage } from 'aws-dsf'

storage.AccessLogsBucket.fromBucketArn(scope: Construct, id: string, bucketArn: string)
```

###### `scope`<sup>Required</sup> <a name="scope" id="aws-dsf.storage.AccessLogsBucket.fromBucketArn.parameter.scope"></a>

- *Type:* constructs.Construct

---

###### `id`<sup>Required</sup> <a name="id" id="aws-dsf.storage.AccessLogsBucket.fromBucketArn.parameter.id"></a>

- *Type:* string

---

###### `bucketArn`<sup>Required</sup> <a name="bucketArn" id="aws-dsf.storage.AccessLogsBucket.fromBucketArn.parameter.bucketArn"></a>

- *Type:* string

---

##### `fromBucketAttributes` <a name="fromBucketAttributes" id="aws-dsf.storage.AccessLogsBucket.fromBucketAttributes"></a>

```typescript
import { storage } from 'aws-dsf'

storage.AccessLogsBucket.fromBucketAttributes(scope: Construct, id: string, attrs: BucketAttributes)
```

Creates a Bucket construct that represents an external bucket.

###### `scope`<sup>Required</sup> <a name="scope" id="aws-dsf.storage.AccessLogsBucket.fromBucketAttributes.parameter.scope"></a>

- *Type:* constructs.Construct

The parent creating construct (usually `this`).

---

###### `id`<sup>Required</sup> <a name="id" id="aws-dsf.storage.AccessLogsBucket.fromBucketAttributes.parameter.id"></a>

- *Type:* string

The construct's name.

---

###### `attrs`<sup>Required</sup> <a name="attrs" id="aws-dsf.storage.AccessLogsBucket.fromBucketAttributes.parameter.attrs"></a>

- *Type:* aws-cdk-lib.aws_s3.BucketAttributes

A `BucketAttributes` object.

Can be obtained from a call to
`bucket.export()` or manually created.

---

##### `fromBucketName` <a name="fromBucketName" id="aws-dsf.storage.AccessLogsBucket.fromBucketName"></a>

```typescript
import { storage } from 'aws-dsf'

storage.AccessLogsBucket.fromBucketName(scope: Construct, id: string, bucketName: string)
```

###### `scope`<sup>Required</sup> <a name="scope" id="aws-dsf.storage.AccessLogsBucket.fromBucketName.parameter.scope"></a>

- *Type:* constructs.Construct

---

###### `id`<sup>Required</sup> <a name="id" id="aws-dsf.storage.AccessLogsBucket.fromBucketName.parameter.id"></a>

- *Type:* string

---

###### `bucketName`<sup>Required</sup> <a name="bucketName" id="aws-dsf.storage.AccessLogsBucket.fromBucketName.parameter.bucketName"></a>

- *Type:* string

---

##### `fromCfnBucket` <a name="fromCfnBucket" id="aws-dsf.storage.AccessLogsBucket.fromCfnBucket"></a>

```typescript
import { storage } from 'aws-dsf'

storage.AccessLogsBucket.fromCfnBucket(cfnBucket: CfnBucket)
```

Create a mutable `IBucket` based on a low-level `CfnBucket`.

###### `cfnBucket`<sup>Required</sup> <a name="cfnBucket" id="aws-dsf.storage.AccessLogsBucket.fromCfnBucket.parameter.cfnBucket"></a>

- *Type:* aws-cdk-lib.aws_s3.CfnBucket

---

##### `validateBucketName` <a name="validateBucketName" id="aws-dsf.storage.AccessLogsBucket.validateBucketName"></a>

```typescript
import { storage } from 'aws-dsf'

storage.AccessLogsBucket.validateBucketName(physicalName: string)
```

Thrown an exception if the given bucket name is not valid.

###### `physicalName`<sup>Required</sup> <a name="physicalName" id="aws-dsf.storage.AccessLogsBucket.validateBucketName.parameter.physicalName"></a>

- *Type:* string

name of the bucket.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.property.env">env</a></code> | <code>aws-cdk-lib.ResourceEnvironment</code> | The environment this resource belongs to. |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.property.stack">stack</a></code> | <code>aws-cdk-lib.Stack</code> | The stack in which this resource is defined. |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.property.bucketArn">bucketArn</a></code> | <code>string</code> | The ARN of the bucket. |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.property.bucketDomainName">bucketDomainName</a></code> | <code>string</code> | The IPv4 DNS name of the specified bucket. |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.property.bucketDualStackDomainName">bucketDualStackDomainName</a></code> | <code>string</code> | The IPv6 DNS name of the specified bucket. |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.property.bucketName">bucketName</a></code> | <code>string</code> | The name of the bucket. |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.property.bucketRegionalDomainName">bucketRegionalDomainName</a></code> | <code>string</code> | The regional domain name of the specified bucket. |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.property.bucketWebsiteDomainName">bucketWebsiteDomainName</a></code> | <code>string</code> | The Domain name of the static website. |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.property.bucketWebsiteUrl">bucketWebsiteUrl</a></code> | <code>string</code> | The URL of the static website. |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.property.encryptionKey">encryptionKey</a></code> | <code>aws-cdk-lib.aws_kms.IKey</code> | Optional KMS encryption key associated with this bucket. |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.property.isWebsite">isWebsite</a></code> | <code>boolean</code> | If this bucket has been configured for static website hosting. |
| <code><a href="#aws-dsf.storage.AccessLogsBucket.property.policy">policy</a></code> | <code>aws-cdk-lib.aws_s3.BucketPolicy</code> | The resource policy associated with this bucket. |

---

##### `node`<sup>Required</sup> <a name="node" id="aws-dsf.storage.AccessLogsBucket.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `env`<sup>Required</sup> <a name="env" id="aws-dsf.storage.AccessLogsBucket.property.env"></a>

```typescript
public readonly env: ResourceEnvironment;
```

- *Type:* aws-cdk-lib.ResourceEnvironment

The environment this resource belongs to.

For resources that are created and managed by the CDK
(generally, those created by creating new class instances like Role, Bucket, etc.),
this is always the same as the environment of the stack they belong to;
however, for imported resources
(those obtained from static methods like fromRoleArn, fromBucketName, etc.),
that might be different than the stack they were imported into.

---

##### `stack`<sup>Required</sup> <a name="stack" id="aws-dsf.storage.AccessLogsBucket.property.stack"></a>

```typescript
public readonly stack: Stack;
```

- *Type:* aws-cdk-lib.Stack

The stack in which this resource is defined.

---

##### `bucketArn`<sup>Required</sup> <a name="bucketArn" id="aws-dsf.storage.AccessLogsBucket.property.bucketArn"></a>

```typescript
public readonly bucketArn: string;
```

- *Type:* string

The ARN of the bucket.

---

##### `bucketDomainName`<sup>Required</sup> <a name="bucketDomainName" id="aws-dsf.storage.AccessLogsBucket.property.bucketDomainName"></a>

```typescript
public readonly bucketDomainName: string;
```

- *Type:* string

The IPv4 DNS name of the specified bucket.

---

##### `bucketDualStackDomainName`<sup>Required</sup> <a name="bucketDualStackDomainName" id="aws-dsf.storage.AccessLogsBucket.property.bucketDualStackDomainName"></a>

```typescript
public readonly bucketDualStackDomainName: string;
```

- *Type:* string

The IPv6 DNS name of the specified bucket.

---

##### `bucketName`<sup>Required</sup> <a name="bucketName" id="aws-dsf.storage.AccessLogsBucket.property.bucketName"></a>

```typescript
public readonly bucketName: string;
```

- *Type:* string

The name of the bucket.

---

##### `bucketRegionalDomainName`<sup>Required</sup> <a name="bucketRegionalDomainName" id="aws-dsf.storage.AccessLogsBucket.property.bucketRegionalDomainName"></a>

```typescript
public readonly bucketRegionalDomainName: string;
```

- *Type:* string

The regional domain name of the specified bucket.

---

##### `bucketWebsiteDomainName`<sup>Required</sup> <a name="bucketWebsiteDomainName" id="aws-dsf.storage.AccessLogsBucket.property.bucketWebsiteDomainName"></a>

```typescript
public readonly bucketWebsiteDomainName: string;
```

- *Type:* string

The Domain name of the static website.

---

##### `bucketWebsiteUrl`<sup>Required</sup> <a name="bucketWebsiteUrl" id="aws-dsf.storage.AccessLogsBucket.property.bucketWebsiteUrl"></a>

```typescript
public readonly bucketWebsiteUrl: string;
```

- *Type:* string

The URL of the static website.

---

##### `encryptionKey`<sup>Optional</sup> <a name="encryptionKey" id="aws-dsf.storage.AccessLogsBucket.property.encryptionKey"></a>

```typescript
public readonly encryptionKey: IKey;
```

- *Type:* aws-cdk-lib.aws_kms.IKey

Optional KMS encryption key associated with this bucket.

---

##### `isWebsite`<sup>Optional</sup> <a name="isWebsite" id="aws-dsf.storage.AccessLogsBucket.property.isWebsite"></a>

```typescript
public readonly isWebsite: boolean;
```

- *Type:* boolean

If this bucket has been configured for static website hosting.

---

##### `policy`<sup>Optional</sup> <a name="policy" id="aws-dsf.storage.AccessLogsBucket.property.policy"></a>

```typescript
public readonly policy: BucketPolicy;
```

- *Type:* aws-cdk-lib.aws_s3.BucketPolicy

The resource policy associated with this bucket.

If `autoCreatePolicy` is true, a `BucketPolicy` will be created upon the
first call to addToResourcePolicy(s).

---


### AnalyticsBucket <a name="AnalyticsBucket" id="aws-dsf.storage.AnalyticsBucket"></a>

Amazon S3 Bucket configured with best-practices and defaults for analytics.

The default bucket name is `analytics-<AWS_ACCOUNT_ID>-<AWS_REGION>-<UNIQUE_ID>`

> [https://awslabs.github.io/data-solutions-framework-on-aws/docs/constructs/library/analytics-bucket](https://awslabs.github.io/data-solutions-framework-on-aws/docs/constructs/library/analytics-bucket)

*Example*

```typescript
import { Key } from 'aws-cdk-lib/aws-kms';

// Set context value for global data removal policy (or set in cdk.json).
this.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

const encryptionKey = new Key(this, 'DataKey', {
 removalPolicy: cdk.RemovalPolicy.DESTROY,
 enableKeyRotation: true,
});

new dsf.storage.AnalyticsBucket(this, 'MyAnalyticsBucket', {
 encryptionKey,
 removalPolicy: cdk.RemovalPolicy.DESTROY,
});
```


#### Initializers <a name="Initializers" id="aws-dsf.storage.AnalyticsBucket.Initializer"></a>

```typescript
import { storage } from 'aws-dsf'

new storage.AnalyticsBucket(scope: Construct, id: string, props: AnalyticsBucketProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | *No description.* |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.Initializer.parameter.props">props</a></code> | <code>aws-dsf.storage.AnalyticsBucketProps</code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="aws-dsf.storage.AnalyticsBucket.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="aws-dsf.storage.AnalyticsBucket.Initializer.parameter.id"></a>

- *Type:* string

---

##### `props`<sup>Required</sup> <a name="props" id="aws-dsf.storage.AnalyticsBucket.Initializer.parameter.props"></a>

- *Type:* aws-dsf.storage.AnalyticsBucketProps

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.applyRemovalPolicy">applyRemovalPolicy</a></code> | Apply the given removal policy to this resource. |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.addEventNotification">addEventNotification</a></code> | Adds a bucket notification event destination. |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.addObjectCreatedNotification">addObjectCreatedNotification</a></code> | Subscribes a destination to receive notifications when an object is created in the bucket. |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.addObjectRemovedNotification">addObjectRemovedNotification</a></code> | Subscribes a destination to receive notifications when an object is removed from the bucket. |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.addToResourcePolicy">addToResourcePolicy</a></code> | Adds a statement to the resource policy for a principal (i.e. account/role/service) to perform actions on this bucket and/or its contents. Use `bucketArn` and `arnForObjects(keys)` to obtain ARNs for this bucket or objects. |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.arnForObjects">arnForObjects</a></code> | Returns an ARN that represents all objects within the bucket that match the key pattern specified. |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.enableEventBridgeNotification">enableEventBridgeNotification</a></code> | Enables event bridge notification, causing all events below to be sent to EventBridge:. |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.grantDelete">grantDelete</a></code> | Grants s3:DeleteObject* permission to an IAM principal for objects in this bucket. |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.grantPublicAccess">grantPublicAccess</a></code> | Allows unrestricted access to objects from this bucket. |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.grantPut">grantPut</a></code> | Grants s3:PutObject* and s3:Abort* permissions for this bucket to an IAM principal. |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.grantPutAcl">grantPutAcl</a></code> | Grant the given IAM identity permissions to modify the ACLs of objects in the given Bucket. |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.grantRead">grantRead</a></code> | Grant read permissions for this bucket and it's contents to an IAM principal (Role/Group/User). |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.grantReadWrite">grantReadWrite</a></code> | Grants read/write permissions for this bucket and it's contents to an IAM principal (Role/Group/User). |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.grantWrite">grantWrite</a></code> | Grant write permissions to this bucket to an IAM principal. |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.onCloudTrailEvent">onCloudTrailEvent</a></code> | Define a CloudWatch event that triggers when something happens to this repository. |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.onCloudTrailPutObject">onCloudTrailPutObject</a></code> | Defines an AWS CloudWatch event that triggers when an object is uploaded to the specified paths (keys) in this bucket using the PutObject API call. |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.onCloudTrailWriteObject">onCloudTrailWriteObject</a></code> | Defines an AWS CloudWatch event that triggers when an object at the specified paths (keys) in this bucket are written to. |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.s3UrlForObject">s3UrlForObject</a></code> | The S3 URL of an S3 object. For example:. |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.transferAccelerationUrlForObject">transferAccelerationUrlForObject</a></code> | The https Transfer Acceleration URL of an S3 object. |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.urlForObject">urlForObject</a></code> | The https URL of an S3 object. Specify `regional: false` at the options for non-regional URLs. For example:. |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.virtualHostedUrlForObject">virtualHostedUrlForObject</a></code> | The virtual hosted-style URL of an S3 object. Specify `regional: false` at the options for non-regional URL. For example:. |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.addCorsRule">addCorsRule</a></code> | Adds a cross-origin access configuration for objects in an Amazon S3 bucket. |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.addInventory">addInventory</a></code> | Add an inventory configuration. |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.addLifecycleRule">addLifecycleRule</a></code> | Add a lifecycle rule to the bucket. |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.addMetric">addMetric</a></code> | Adds a metrics configuration for the CloudWatch request metrics from the bucket. |

---

##### `toString` <a name="toString" id="aws-dsf.storage.AnalyticsBucket.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `applyRemovalPolicy` <a name="applyRemovalPolicy" id="aws-dsf.storage.AnalyticsBucket.applyRemovalPolicy"></a>

```typescript
public applyRemovalPolicy(policy: RemovalPolicy): void
```

Apply the given removal policy to this resource.

The Removal Policy controls what happens to this resource when it stops
being managed by CloudFormation, either because you've removed it from the
CDK application or because you've made a change that requires the resource
to be replaced.

The resource can be deleted (`RemovalPolicy.DESTROY`), or left in your AWS
account for data recovery and cleanup later (`RemovalPolicy.RETAIN`).

###### `policy`<sup>Required</sup> <a name="policy" id="aws-dsf.storage.AnalyticsBucket.applyRemovalPolicy.parameter.policy"></a>

- *Type:* aws-cdk-lib.RemovalPolicy

---

##### `addEventNotification` <a name="addEventNotification" id="aws-dsf.storage.AnalyticsBucket.addEventNotification"></a>

```typescript
public addEventNotification(event: EventType, dest: IBucketNotificationDestination, filters: NotificationKeyFilter): void
```

Adds a bucket notification event destination.

> [https://docs.aws.amazon.com/AmazonS3/latest/dev/NotificationHowTo.html](https://docs.aws.amazon.com/AmazonS3/latest/dev/NotificationHowTo.html)

*Example*

```typescript
   declare const myLambda: lambda.Function;
   const bucket = new s3.Bucket(this, 'MyBucket');
   bucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(myLambda), {prefix: 'home/myusername/*'});
```


###### `event`<sup>Required</sup> <a name="event" id="aws-dsf.storage.AnalyticsBucket.addEventNotification.parameter.event"></a>

- *Type:* aws-cdk-lib.aws_s3.EventType

The event to trigger the notification.

---

###### `dest`<sup>Required</sup> <a name="dest" id="aws-dsf.storage.AnalyticsBucket.addEventNotification.parameter.dest"></a>

- *Type:* aws-cdk-lib.aws_s3.IBucketNotificationDestination

The notification destination (Lambda, SNS Topic or SQS Queue).

---

###### `filters`<sup>Required</sup> <a name="filters" id="aws-dsf.storage.AnalyticsBucket.addEventNotification.parameter.filters"></a>

- *Type:* aws-cdk-lib.aws_s3.NotificationKeyFilter

S3 object key filter rules to determine which objects trigger this event.

Each filter must include a `prefix` and/or `suffix`
that will be matched against the s3 object key. Refer to the S3 Developer Guide
for details about allowed filter rules.

---

##### `addObjectCreatedNotification` <a name="addObjectCreatedNotification" id="aws-dsf.storage.AnalyticsBucket.addObjectCreatedNotification"></a>

```typescript
public addObjectCreatedNotification(dest: IBucketNotificationDestination, filters: NotificationKeyFilter): void
```

Subscribes a destination to receive notifications when an object is created in the bucket.

This is identical to calling
`onEvent(EventType.OBJECT_CREATED)`.

###### `dest`<sup>Required</sup> <a name="dest" id="aws-dsf.storage.AnalyticsBucket.addObjectCreatedNotification.parameter.dest"></a>

- *Type:* aws-cdk-lib.aws_s3.IBucketNotificationDestination

The notification destination (see onEvent).

---

###### `filters`<sup>Required</sup> <a name="filters" id="aws-dsf.storage.AnalyticsBucket.addObjectCreatedNotification.parameter.filters"></a>

- *Type:* aws-cdk-lib.aws_s3.NotificationKeyFilter

Filters (see onEvent).

---

##### `addObjectRemovedNotification` <a name="addObjectRemovedNotification" id="aws-dsf.storage.AnalyticsBucket.addObjectRemovedNotification"></a>

```typescript
public addObjectRemovedNotification(dest: IBucketNotificationDestination, filters: NotificationKeyFilter): void
```

Subscribes a destination to receive notifications when an object is removed from the bucket.

This is identical to calling
`onEvent(EventType.OBJECT_REMOVED)`.

###### `dest`<sup>Required</sup> <a name="dest" id="aws-dsf.storage.AnalyticsBucket.addObjectRemovedNotification.parameter.dest"></a>

- *Type:* aws-cdk-lib.aws_s3.IBucketNotificationDestination

The notification destination (see onEvent).

---

###### `filters`<sup>Required</sup> <a name="filters" id="aws-dsf.storage.AnalyticsBucket.addObjectRemovedNotification.parameter.filters"></a>

- *Type:* aws-cdk-lib.aws_s3.NotificationKeyFilter

Filters (see onEvent).

---

##### `addToResourcePolicy` <a name="addToResourcePolicy" id="aws-dsf.storage.AnalyticsBucket.addToResourcePolicy"></a>

```typescript
public addToResourcePolicy(permission: PolicyStatement): AddToResourcePolicyResult
```

Adds a statement to the resource policy for a principal (i.e. account/role/service) to perform actions on this bucket and/or its contents. Use `bucketArn` and `arnForObjects(keys)` to obtain ARNs for this bucket or objects.

Note that the policy statement may or may not be added to the policy.
For example, when an `IBucket` is created from an existing bucket,
it's not possible to tell whether the bucket already has a policy
attached, let alone to re-use that policy to add more statements to it.
So it's safest to do nothing in these cases.

###### `permission`<sup>Required</sup> <a name="permission" id="aws-dsf.storage.AnalyticsBucket.addToResourcePolicy.parameter.permission"></a>

- *Type:* aws-cdk-lib.aws_iam.PolicyStatement

the policy statement to be added to the bucket's policy.

---

##### `arnForObjects` <a name="arnForObjects" id="aws-dsf.storage.AnalyticsBucket.arnForObjects"></a>

```typescript
public arnForObjects(keyPattern: string): string
```

Returns an ARN that represents all objects within the bucket that match the key pattern specified.

To represent all keys, specify ``"*"``.

If you need to specify a keyPattern with multiple components, concatenate them into a single string, e.g.:

  arnForObjects(`home/${team}/${user}/*`)

###### `keyPattern`<sup>Required</sup> <a name="keyPattern" id="aws-dsf.storage.AnalyticsBucket.arnForObjects.parameter.keyPattern"></a>

- *Type:* string

---

##### `enableEventBridgeNotification` <a name="enableEventBridgeNotification" id="aws-dsf.storage.AnalyticsBucket.enableEventBridgeNotification"></a>

```typescript
public enableEventBridgeNotification(): void
```

Enables event bridge notification, causing all events below to be sent to EventBridge:.

Object Deleted (DeleteObject)
- Object Deleted (Lifecycle expiration)
- Object Restore Initiated
- Object Restore Completed
- Object Restore Expired
- Object Storage Class Changed
- Object Access Tier Changed
- Object ACL Updated
- Object Tags Added
- Object Tags Deleted

##### `grantDelete` <a name="grantDelete" id="aws-dsf.storage.AnalyticsBucket.grantDelete"></a>

```typescript
public grantDelete(identity: IGrantable, objectsKeyPattern?: any): Grant
```

Grants s3:DeleteObject* permission to an IAM principal for objects in this bucket.

###### `identity`<sup>Required</sup> <a name="identity" id="aws-dsf.storage.AnalyticsBucket.grantDelete.parameter.identity"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

The principal.

---

###### `objectsKeyPattern`<sup>Optional</sup> <a name="objectsKeyPattern" id="aws-dsf.storage.AnalyticsBucket.grantDelete.parameter.objectsKeyPattern"></a>

- *Type:* any

Restrict the permission to a certain key pattern (default '*').

Parameter type is `any` but `string` should be passed in.

---

##### `grantPublicAccess` <a name="grantPublicAccess" id="aws-dsf.storage.AnalyticsBucket.grantPublicAccess"></a>

```typescript
public grantPublicAccess(allowedActions: string, keyPrefix?: string): Grant
```

Allows unrestricted access to objects from this bucket.

IMPORTANT: This permission allows anyone to perform actions on S3 objects
in this bucket, which is useful for when you configure your bucket as a
website and want everyone to be able to read objects in the bucket without
needing to authenticate.

Without arguments, this method will grant read ("s3:GetObject") access to
all objects ("*") in the bucket.

The method returns the `iam.Grant` object, which can then be modified
as needed. For example, you can add a condition that will restrict access only
to an IPv4 range like this:

    const grant = bucket.grantPublicAccess();
    grant.resourceStatement!.addCondition(‘IpAddress’, { “aws:SourceIp”: “54.240.143.0/24” });

Note that if this `IBucket` refers to an existing bucket, possibly not
managed by CloudFormation, this method will have no effect, since it's
impossible to modify the policy of an existing bucket.

###### `allowedActions`<sup>Required</sup> <a name="allowedActions" id="aws-dsf.storage.AnalyticsBucket.grantPublicAccess.parameter.allowedActions"></a>

- *Type:* string

the set of S3 actions to allow.

Default is "s3:GetObject".

---

###### `keyPrefix`<sup>Optional</sup> <a name="keyPrefix" id="aws-dsf.storage.AnalyticsBucket.grantPublicAccess.parameter.keyPrefix"></a>

- *Type:* string

the prefix of S3 object keys (e.g. `home/*`). Default is "*".

---

##### `grantPut` <a name="grantPut" id="aws-dsf.storage.AnalyticsBucket.grantPut"></a>

```typescript
public grantPut(identity: IGrantable, objectsKeyPattern?: any): Grant
```

Grants s3:PutObject* and s3:Abort* permissions for this bucket to an IAM principal.

If encryption is used, permission to use the key to encrypt the contents
of written files will also be granted to the same principal.

###### `identity`<sup>Required</sup> <a name="identity" id="aws-dsf.storage.AnalyticsBucket.grantPut.parameter.identity"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

The principal.

---

###### `objectsKeyPattern`<sup>Optional</sup> <a name="objectsKeyPattern" id="aws-dsf.storage.AnalyticsBucket.grantPut.parameter.objectsKeyPattern"></a>

- *Type:* any

Restrict the permission to a certain key pattern (default '*').

Parameter type is `any` but `string` should be passed in.

---

##### `grantPutAcl` <a name="grantPutAcl" id="aws-dsf.storage.AnalyticsBucket.grantPutAcl"></a>

```typescript
public grantPutAcl(identity: IGrantable, objectsKeyPattern?: string): Grant
```

Grant the given IAM identity permissions to modify the ACLs of objects in the given Bucket.

If your application has the '@aws-cdk/aws-s3:grantWriteWithoutAcl' feature flag set,
calling `grantWrite` or `grantReadWrite` no longer grants permissions to modify the ACLs of the objects;
in this case, if you need to modify object ACLs, call this method explicitly.

###### `identity`<sup>Required</sup> <a name="identity" id="aws-dsf.storage.AnalyticsBucket.grantPutAcl.parameter.identity"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

---

###### `objectsKeyPattern`<sup>Optional</sup> <a name="objectsKeyPattern" id="aws-dsf.storage.AnalyticsBucket.grantPutAcl.parameter.objectsKeyPattern"></a>

- *Type:* string

---

##### `grantRead` <a name="grantRead" id="aws-dsf.storage.AnalyticsBucket.grantRead"></a>

```typescript
public grantRead(identity: IGrantable, objectsKeyPattern?: any): Grant
```

Grant read permissions for this bucket and it's contents to an IAM principal (Role/Group/User).

If encryption is used, permission to use the key to decrypt the contents
of the bucket will also be granted to the same principal.

###### `identity`<sup>Required</sup> <a name="identity" id="aws-dsf.storage.AnalyticsBucket.grantRead.parameter.identity"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

The principal.

---

###### `objectsKeyPattern`<sup>Optional</sup> <a name="objectsKeyPattern" id="aws-dsf.storage.AnalyticsBucket.grantRead.parameter.objectsKeyPattern"></a>

- *Type:* any

Restrict the permission to a certain key pattern (default '*').

Parameter type is `any` but `string` should be passed in.

---

##### `grantReadWrite` <a name="grantReadWrite" id="aws-dsf.storage.AnalyticsBucket.grantReadWrite"></a>

```typescript
public grantReadWrite(identity: IGrantable, objectsKeyPattern?: any): Grant
```

Grants read/write permissions for this bucket and it's contents to an IAM principal (Role/Group/User).

If an encryption key is used, permission to use the key for
encrypt/decrypt will also be granted.

Before CDK version 1.85.0, this method granted the `s3:PutObject*` permission that included `s3:PutObjectAcl`,
which could be used to grant read/write object access to IAM principals in other accounts.
If you want to get rid of that behavior, update your CDK version to 1.85.0 or later,
and make sure the `@aws-cdk/aws-s3:grantWriteWithoutAcl` feature flag is set to `true`
in the `context` key of your cdk.json file.
If you've already updated, but still need the principal to have permissions to modify the ACLs,
use the `grantPutAcl` method.

###### `identity`<sup>Required</sup> <a name="identity" id="aws-dsf.storage.AnalyticsBucket.grantReadWrite.parameter.identity"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

---

###### `objectsKeyPattern`<sup>Optional</sup> <a name="objectsKeyPattern" id="aws-dsf.storage.AnalyticsBucket.grantReadWrite.parameter.objectsKeyPattern"></a>

- *Type:* any

---

##### `grantWrite` <a name="grantWrite" id="aws-dsf.storage.AnalyticsBucket.grantWrite"></a>

```typescript
public grantWrite(identity: IGrantable, objectsKeyPattern?: any, allowedActionPatterns?: string[]): Grant
```

Grant write permissions to this bucket to an IAM principal.

If encryption is used, permission to use the key to encrypt the contents
of written files will also be granted to the same principal.

Before CDK version 1.85.0, this method granted the `s3:PutObject*` permission that included `s3:PutObjectAcl`,
which could be used to grant read/write object access to IAM principals in other accounts.
If you want to get rid of that behavior, update your CDK version to 1.85.0 or later,
and make sure the `@aws-cdk/aws-s3:grantWriteWithoutAcl` feature flag is set to `true`
in the `context` key of your cdk.json file.
If you've already updated, but still need the principal to have permissions to modify the ACLs,
use the `grantPutAcl` method.

###### `identity`<sup>Required</sup> <a name="identity" id="aws-dsf.storage.AnalyticsBucket.grantWrite.parameter.identity"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

---

###### `objectsKeyPattern`<sup>Optional</sup> <a name="objectsKeyPattern" id="aws-dsf.storage.AnalyticsBucket.grantWrite.parameter.objectsKeyPattern"></a>

- *Type:* any

---

###### `allowedActionPatterns`<sup>Optional</sup> <a name="allowedActionPatterns" id="aws-dsf.storage.AnalyticsBucket.grantWrite.parameter.allowedActionPatterns"></a>

- *Type:* string[]

---

##### `onCloudTrailEvent` <a name="onCloudTrailEvent" id="aws-dsf.storage.AnalyticsBucket.onCloudTrailEvent"></a>

```typescript
public onCloudTrailEvent(id: string, options?: OnCloudTrailBucketEventOptions): Rule
```

Define a CloudWatch event that triggers when something happens to this repository.

Requires that there exists at least one CloudTrail Trail in your account
that captures the event. This method will not create the Trail.

###### `id`<sup>Required</sup> <a name="id" id="aws-dsf.storage.AnalyticsBucket.onCloudTrailEvent.parameter.id"></a>

- *Type:* string

The id of the rule.

---

###### `options`<sup>Optional</sup> <a name="options" id="aws-dsf.storage.AnalyticsBucket.onCloudTrailEvent.parameter.options"></a>

- *Type:* aws-cdk-lib.aws_s3.OnCloudTrailBucketEventOptions

Options for adding the rule.

---

##### `onCloudTrailPutObject` <a name="onCloudTrailPutObject" id="aws-dsf.storage.AnalyticsBucket.onCloudTrailPutObject"></a>

```typescript
public onCloudTrailPutObject(id: string, options?: OnCloudTrailBucketEventOptions): Rule
```

Defines an AWS CloudWatch event that triggers when an object is uploaded to the specified paths (keys) in this bucket using the PutObject API call.

Note that some tools like `aws s3 cp` will automatically use either
PutObject or the multipart upload API depending on the file size,
so using `onCloudTrailWriteObject` may be preferable.

Requires that there exists at least one CloudTrail Trail in your account
that captures the event. This method will not create the Trail.

###### `id`<sup>Required</sup> <a name="id" id="aws-dsf.storage.AnalyticsBucket.onCloudTrailPutObject.parameter.id"></a>

- *Type:* string

The id of the rule.

---

###### `options`<sup>Optional</sup> <a name="options" id="aws-dsf.storage.AnalyticsBucket.onCloudTrailPutObject.parameter.options"></a>

- *Type:* aws-cdk-lib.aws_s3.OnCloudTrailBucketEventOptions

Options for adding the rule.

---

##### `onCloudTrailWriteObject` <a name="onCloudTrailWriteObject" id="aws-dsf.storage.AnalyticsBucket.onCloudTrailWriteObject"></a>

```typescript
public onCloudTrailWriteObject(id: string, options?: OnCloudTrailBucketEventOptions): Rule
```

Defines an AWS CloudWatch event that triggers when an object at the specified paths (keys) in this bucket are written to.

This includes
the events PutObject, CopyObject, and CompleteMultipartUpload.

Note that some tools like `aws s3 cp` will automatically use either
PutObject or the multipart upload API depending on the file size,
so using this method may be preferable to `onCloudTrailPutObject`.

Requires that there exists at least one CloudTrail Trail in your account
that captures the event. This method will not create the Trail.

###### `id`<sup>Required</sup> <a name="id" id="aws-dsf.storage.AnalyticsBucket.onCloudTrailWriteObject.parameter.id"></a>

- *Type:* string

The id of the rule.

---

###### `options`<sup>Optional</sup> <a name="options" id="aws-dsf.storage.AnalyticsBucket.onCloudTrailWriteObject.parameter.options"></a>

- *Type:* aws-cdk-lib.aws_s3.OnCloudTrailBucketEventOptions

Options for adding the rule.

---

##### `s3UrlForObject` <a name="s3UrlForObject" id="aws-dsf.storage.AnalyticsBucket.s3UrlForObject"></a>

```typescript
public s3UrlForObject(key?: string): string
```

The S3 URL of an S3 object. For example:.

`s3://onlybucket`
- `s3://bucket/key`

###### `key`<sup>Optional</sup> <a name="key" id="aws-dsf.storage.AnalyticsBucket.s3UrlForObject.parameter.key"></a>

- *Type:* string

The S3 key of the object.

If not specified, the S3 URL of the
bucket is returned.

---

##### `transferAccelerationUrlForObject` <a name="transferAccelerationUrlForObject" id="aws-dsf.storage.AnalyticsBucket.transferAccelerationUrlForObject"></a>

```typescript
public transferAccelerationUrlForObject(key?: string, options?: TransferAccelerationUrlOptions): string
```

The https Transfer Acceleration URL of an S3 object.

Specify `dualStack: true` at the options
for dual-stack endpoint (connect to the bucket over IPv6). For example:

- `https://bucket.s3-accelerate.amazonaws.com`
- `https://bucket.s3-accelerate.amazonaws.com/key`

###### `key`<sup>Optional</sup> <a name="key" id="aws-dsf.storage.AnalyticsBucket.transferAccelerationUrlForObject.parameter.key"></a>

- *Type:* string

The S3 key of the object.

If not specified, the URL of the
bucket is returned.

---

###### `options`<sup>Optional</sup> <a name="options" id="aws-dsf.storage.AnalyticsBucket.transferAccelerationUrlForObject.parameter.options"></a>

- *Type:* aws-cdk-lib.aws_s3.TransferAccelerationUrlOptions

Options for generating URL.

---

##### `urlForObject` <a name="urlForObject" id="aws-dsf.storage.AnalyticsBucket.urlForObject"></a>

```typescript
public urlForObject(key?: string): string
```

The https URL of an S3 object. Specify `regional: false` at the options for non-regional URLs. For example:.

`https://s3.us-west-1.amazonaws.com/onlybucket`
- `https://s3.us-west-1.amazonaws.com/bucket/key`
- `https://s3.cn-north-1.amazonaws.com.cn/china-bucket/mykey`

###### `key`<sup>Optional</sup> <a name="key" id="aws-dsf.storage.AnalyticsBucket.urlForObject.parameter.key"></a>

- *Type:* string

The S3 key of the object.

If not specified, the URL of the
bucket is returned.

---

##### `virtualHostedUrlForObject` <a name="virtualHostedUrlForObject" id="aws-dsf.storage.AnalyticsBucket.virtualHostedUrlForObject"></a>

```typescript
public virtualHostedUrlForObject(key?: string, options?: VirtualHostedStyleUrlOptions): string
```

The virtual hosted-style URL of an S3 object. Specify `regional: false` at the options for non-regional URL. For example:.

`https://only-bucket.s3.us-west-1.amazonaws.com`
- `https://bucket.s3.us-west-1.amazonaws.com/key`
- `https://bucket.s3.amazonaws.com/key`
- `https://china-bucket.s3.cn-north-1.amazonaws.com.cn/mykey`

###### `key`<sup>Optional</sup> <a name="key" id="aws-dsf.storage.AnalyticsBucket.virtualHostedUrlForObject.parameter.key"></a>

- *Type:* string

The S3 key of the object.

If not specified, the URL of the
bucket is returned.

---

###### `options`<sup>Optional</sup> <a name="options" id="aws-dsf.storage.AnalyticsBucket.virtualHostedUrlForObject.parameter.options"></a>

- *Type:* aws-cdk-lib.aws_s3.VirtualHostedStyleUrlOptions

Options for generating URL.

---

##### `addCorsRule` <a name="addCorsRule" id="aws-dsf.storage.AnalyticsBucket.addCorsRule"></a>

```typescript
public addCorsRule(rule: CorsRule): void
```

Adds a cross-origin access configuration for objects in an Amazon S3 bucket.

###### `rule`<sup>Required</sup> <a name="rule" id="aws-dsf.storage.AnalyticsBucket.addCorsRule.parameter.rule"></a>

- *Type:* aws-cdk-lib.aws_s3.CorsRule

The CORS configuration rule to add.

---

##### `addInventory` <a name="addInventory" id="aws-dsf.storage.AnalyticsBucket.addInventory"></a>

```typescript
public addInventory(inventory: Inventory): void
```

Add an inventory configuration.

###### `inventory`<sup>Required</sup> <a name="inventory" id="aws-dsf.storage.AnalyticsBucket.addInventory.parameter.inventory"></a>

- *Type:* aws-cdk-lib.aws_s3.Inventory

configuration to add.

---

##### `addLifecycleRule` <a name="addLifecycleRule" id="aws-dsf.storage.AnalyticsBucket.addLifecycleRule"></a>

```typescript
public addLifecycleRule(rule: LifecycleRule): void
```

Add a lifecycle rule to the bucket.

###### `rule`<sup>Required</sup> <a name="rule" id="aws-dsf.storage.AnalyticsBucket.addLifecycleRule.parameter.rule"></a>

- *Type:* aws-cdk-lib.aws_s3.LifecycleRule

The rule to add.

---

##### `addMetric` <a name="addMetric" id="aws-dsf.storage.AnalyticsBucket.addMetric"></a>

```typescript
public addMetric(metric: BucketMetrics): void
```

Adds a metrics configuration for the CloudWatch request metrics from the bucket.

###### `metric`<sup>Required</sup> <a name="metric" id="aws-dsf.storage.AnalyticsBucket.addMetric.parameter.metric"></a>

- *Type:* aws-cdk-lib.aws_s3.BucketMetrics

The metric configuration to add.

---

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.isOwnedResource">isOwnedResource</a></code> | Returns true if the construct was created by CDK, and false otherwise. |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.isResource">isResource</a></code> | Check whether the given construct is a Resource. |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.fromBucketArn">fromBucketArn</a></code> | *No description.* |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.fromBucketAttributes">fromBucketAttributes</a></code> | Creates a Bucket construct that represents an external bucket. |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.fromBucketName">fromBucketName</a></code> | *No description.* |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.fromCfnBucket">fromCfnBucket</a></code> | Create a mutable `IBucket` based on a low-level `CfnBucket`. |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.validateBucketName">validateBucketName</a></code> | Thrown an exception if the given bucket name is not valid. |

---

##### `isConstruct` <a name="isConstruct" id="aws-dsf.storage.AnalyticsBucket.isConstruct"></a>

```typescript
import { storage } from 'aws-dsf'

storage.AnalyticsBucket.isConstruct(x: any)
```

Checks if `x` is a construct.

Use this method instead of `instanceof` to properly detect `Construct`
instances, even when the construct library is symlinked.

Explanation: in JavaScript, multiple copies of the `constructs` library on
disk are seen as independent, completely different libraries. As a
consequence, the class `Construct` in each copy of the `constructs` library
is seen as a different class, and an instance of one class will not test as
`instanceof` the other class. `npm install` will not create installations
like this, but users may manually symlink construct libraries together or
use a monorepo tool: in those cases, multiple copies of the `constructs`
library can be accidentally installed, and `instanceof` will behave
unpredictably. It is safest to avoid using `instanceof`, and using
this type-testing method instead.

###### `x`<sup>Required</sup> <a name="x" id="aws-dsf.storage.AnalyticsBucket.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

##### `isOwnedResource` <a name="isOwnedResource" id="aws-dsf.storage.AnalyticsBucket.isOwnedResource"></a>

```typescript
import { storage } from 'aws-dsf'

storage.AnalyticsBucket.isOwnedResource(construct: IConstruct)
```

Returns true if the construct was created by CDK, and false otherwise.

###### `construct`<sup>Required</sup> <a name="construct" id="aws-dsf.storage.AnalyticsBucket.isOwnedResource.parameter.construct"></a>

- *Type:* constructs.IConstruct

---

##### `isResource` <a name="isResource" id="aws-dsf.storage.AnalyticsBucket.isResource"></a>

```typescript
import { storage } from 'aws-dsf'

storage.AnalyticsBucket.isResource(construct: IConstruct)
```

Check whether the given construct is a Resource.

###### `construct`<sup>Required</sup> <a name="construct" id="aws-dsf.storage.AnalyticsBucket.isResource.parameter.construct"></a>

- *Type:* constructs.IConstruct

---

##### `fromBucketArn` <a name="fromBucketArn" id="aws-dsf.storage.AnalyticsBucket.fromBucketArn"></a>

```typescript
import { storage } from 'aws-dsf'

storage.AnalyticsBucket.fromBucketArn(scope: Construct, id: string, bucketArn: string)
```

###### `scope`<sup>Required</sup> <a name="scope" id="aws-dsf.storage.AnalyticsBucket.fromBucketArn.parameter.scope"></a>

- *Type:* constructs.Construct

---

###### `id`<sup>Required</sup> <a name="id" id="aws-dsf.storage.AnalyticsBucket.fromBucketArn.parameter.id"></a>

- *Type:* string

---

###### `bucketArn`<sup>Required</sup> <a name="bucketArn" id="aws-dsf.storage.AnalyticsBucket.fromBucketArn.parameter.bucketArn"></a>

- *Type:* string

---

##### `fromBucketAttributes` <a name="fromBucketAttributes" id="aws-dsf.storage.AnalyticsBucket.fromBucketAttributes"></a>

```typescript
import { storage } from 'aws-dsf'

storage.AnalyticsBucket.fromBucketAttributes(scope: Construct, id: string, attrs: BucketAttributes)
```

Creates a Bucket construct that represents an external bucket.

###### `scope`<sup>Required</sup> <a name="scope" id="aws-dsf.storage.AnalyticsBucket.fromBucketAttributes.parameter.scope"></a>

- *Type:* constructs.Construct

The parent creating construct (usually `this`).

---

###### `id`<sup>Required</sup> <a name="id" id="aws-dsf.storage.AnalyticsBucket.fromBucketAttributes.parameter.id"></a>

- *Type:* string

The construct's name.

---

###### `attrs`<sup>Required</sup> <a name="attrs" id="aws-dsf.storage.AnalyticsBucket.fromBucketAttributes.parameter.attrs"></a>

- *Type:* aws-cdk-lib.aws_s3.BucketAttributes

A `BucketAttributes` object.

Can be obtained from a call to
`bucket.export()` or manually created.

---

##### `fromBucketName` <a name="fromBucketName" id="aws-dsf.storage.AnalyticsBucket.fromBucketName"></a>

```typescript
import { storage } from 'aws-dsf'

storage.AnalyticsBucket.fromBucketName(scope: Construct, id: string, bucketName: string)
```

###### `scope`<sup>Required</sup> <a name="scope" id="aws-dsf.storage.AnalyticsBucket.fromBucketName.parameter.scope"></a>

- *Type:* constructs.Construct

---

###### `id`<sup>Required</sup> <a name="id" id="aws-dsf.storage.AnalyticsBucket.fromBucketName.parameter.id"></a>

- *Type:* string

---

###### `bucketName`<sup>Required</sup> <a name="bucketName" id="aws-dsf.storage.AnalyticsBucket.fromBucketName.parameter.bucketName"></a>

- *Type:* string

---

##### `fromCfnBucket` <a name="fromCfnBucket" id="aws-dsf.storage.AnalyticsBucket.fromCfnBucket"></a>

```typescript
import { storage } from 'aws-dsf'

storage.AnalyticsBucket.fromCfnBucket(cfnBucket: CfnBucket)
```

Create a mutable `IBucket` based on a low-level `CfnBucket`.

###### `cfnBucket`<sup>Required</sup> <a name="cfnBucket" id="aws-dsf.storage.AnalyticsBucket.fromCfnBucket.parameter.cfnBucket"></a>

- *Type:* aws-cdk-lib.aws_s3.CfnBucket

---

##### `validateBucketName` <a name="validateBucketName" id="aws-dsf.storage.AnalyticsBucket.validateBucketName"></a>

```typescript
import { storage } from 'aws-dsf'

storage.AnalyticsBucket.validateBucketName(physicalName: string)
```

Thrown an exception if the given bucket name is not valid.

###### `physicalName`<sup>Required</sup> <a name="physicalName" id="aws-dsf.storage.AnalyticsBucket.validateBucketName.parameter.physicalName"></a>

- *Type:* string

name of the bucket.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.property.env">env</a></code> | <code>aws-cdk-lib.ResourceEnvironment</code> | The environment this resource belongs to. |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.property.stack">stack</a></code> | <code>aws-cdk-lib.Stack</code> | The stack in which this resource is defined. |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.property.bucketArn">bucketArn</a></code> | <code>string</code> | The ARN of the bucket. |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.property.bucketDomainName">bucketDomainName</a></code> | <code>string</code> | The IPv4 DNS name of the specified bucket. |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.property.bucketDualStackDomainName">bucketDualStackDomainName</a></code> | <code>string</code> | The IPv6 DNS name of the specified bucket. |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.property.bucketName">bucketName</a></code> | <code>string</code> | The name of the bucket. |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.property.bucketRegionalDomainName">bucketRegionalDomainName</a></code> | <code>string</code> | The regional domain name of the specified bucket. |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.property.bucketWebsiteDomainName">bucketWebsiteDomainName</a></code> | <code>string</code> | The Domain name of the static website. |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.property.bucketWebsiteUrl">bucketWebsiteUrl</a></code> | <code>string</code> | The URL of the static website. |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.property.encryptionKey">encryptionKey</a></code> | <code>aws-cdk-lib.aws_kms.IKey</code> | Optional KMS encryption key associated with this bucket. |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.property.isWebsite">isWebsite</a></code> | <code>boolean</code> | If this bucket has been configured for static website hosting. |
| <code><a href="#aws-dsf.storage.AnalyticsBucket.property.policy">policy</a></code> | <code>aws-cdk-lib.aws_s3.BucketPolicy</code> | The resource policy associated with this bucket. |

---

##### `node`<sup>Required</sup> <a name="node" id="aws-dsf.storage.AnalyticsBucket.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `env`<sup>Required</sup> <a name="env" id="aws-dsf.storage.AnalyticsBucket.property.env"></a>

```typescript
public readonly env: ResourceEnvironment;
```

- *Type:* aws-cdk-lib.ResourceEnvironment

The environment this resource belongs to.

For resources that are created and managed by the CDK
(generally, those created by creating new class instances like Role, Bucket, etc.),
this is always the same as the environment of the stack they belong to;
however, for imported resources
(those obtained from static methods like fromRoleArn, fromBucketName, etc.),
that might be different than the stack they were imported into.

---

##### `stack`<sup>Required</sup> <a name="stack" id="aws-dsf.storage.AnalyticsBucket.property.stack"></a>

```typescript
public readonly stack: Stack;
```

- *Type:* aws-cdk-lib.Stack

The stack in which this resource is defined.

---

##### `bucketArn`<sup>Required</sup> <a name="bucketArn" id="aws-dsf.storage.AnalyticsBucket.property.bucketArn"></a>

```typescript
public readonly bucketArn: string;
```

- *Type:* string

The ARN of the bucket.

---

##### `bucketDomainName`<sup>Required</sup> <a name="bucketDomainName" id="aws-dsf.storage.AnalyticsBucket.property.bucketDomainName"></a>

```typescript
public readonly bucketDomainName: string;
```

- *Type:* string

The IPv4 DNS name of the specified bucket.

---

##### `bucketDualStackDomainName`<sup>Required</sup> <a name="bucketDualStackDomainName" id="aws-dsf.storage.AnalyticsBucket.property.bucketDualStackDomainName"></a>

```typescript
public readonly bucketDualStackDomainName: string;
```

- *Type:* string

The IPv6 DNS name of the specified bucket.

---

##### `bucketName`<sup>Required</sup> <a name="bucketName" id="aws-dsf.storage.AnalyticsBucket.property.bucketName"></a>

```typescript
public readonly bucketName: string;
```

- *Type:* string

The name of the bucket.

---

##### `bucketRegionalDomainName`<sup>Required</sup> <a name="bucketRegionalDomainName" id="aws-dsf.storage.AnalyticsBucket.property.bucketRegionalDomainName"></a>

```typescript
public readonly bucketRegionalDomainName: string;
```

- *Type:* string

The regional domain name of the specified bucket.

---

##### `bucketWebsiteDomainName`<sup>Required</sup> <a name="bucketWebsiteDomainName" id="aws-dsf.storage.AnalyticsBucket.property.bucketWebsiteDomainName"></a>

```typescript
public readonly bucketWebsiteDomainName: string;
```

- *Type:* string

The Domain name of the static website.

---

##### `bucketWebsiteUrl`<sup>Required</sup> <a name="bucketWebsiteUrl" id="aws-dsf.storage.AnalyticsBucket.property.bucketWebsiteUrl"></a>

```typescript
public readonly bucketWebsiteUrl: string;
```

- *Type:* string

The URL of the static website.

---

##### `encryptionKey`<sup>Optional</sup> <a name="encryptionKey" id="aws-dsf.storage.AnalyticsBucket.property.encryptionKey"></a>

```typescript
public readonly encryptionKey: IKey;
```

- *Type:* aws-cdk-lib.aws_kms.IKey

Optional KMS encryption key associated with this bucket.

---

##### `isWebsite`<sup>Optional</sup> <a name="isWebsite" id="aws-dsf.storage.AnalyticsBucket.property.isWebsite"></a>

```typescript
public readonly isWebsite: boolean;
```

- *Type:* boolean

If this bucket has been configured for static website hosting.

---

##### `policy`<sup>Optional</sup> <a name="policy" id="aws-dsf.storage.AnalyticsBucket.property.policy"></a>

```typescript
public readonly policy: BucketPolicy;
```

- *Type:* aws-cdk-lib.aws_s3.BucketPolicy

The resource policy associated with this bucket.

If `autoCreatePolicy` is true, a `BucketPolicy` will be created upon the
first call to addToResourcePolicy(s).

---


### ApplicationStage <a name="ApplicationStage" id="aws-dsf.utils.ApplicationStage"></a>

ApplicationStage class that creates a CDK Pipelines Stage from an ApplicationStackFactory.

#### Initializers <a name="Initializers" id="aws-dsf.utils.ApplicationStage.Initializer"></a>

```typescript
import { utils } from 'aws-dsf'

new utils.ApplicationStage(scope: Construct, id: string, props: ApplicationStageProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.utils.ApplicationStage.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | the Scope of the CDK Construct. |
| <code><a href="#aws-dsf.utils.ApplicationStage.Initializer.parameter.id">id</a></code> | <code>string</code> | the ID of the CDK Construct. |
| <code><a href="#aws-dsf.utils.ApplicationStage.Initializer.parameter.props">props</a></code> | <code>aws-dsf.utils.ApplicationStageProps</code> | the ApplicationStage properties. |

---

##### `scope`<sup>Required</sup> <a name="scope" id="aws-dsf.utils.ApplicationStage.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

the Scope of the CDK Construct.

---

##### `id`<sup>Required</sup> <a name="id" id="aws-dsf.utils.ApplicationStage.Initializer.parameter.id"></a>

- *Type:* string

the ID of the CDK Construct.

---

##### `props`<sup>Required</sup> <a name="props" id="aws-dsf.utils.ApplicationStage.Initializer.parameter.props"></a>

- *Type:* aws-dsf.utils.ApplicationStageProps

the ApplicationStage properties.

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-dsf.utils.ApplicationStage.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#aws-dsf.utils.ApplicationStage.synth">synth</a></code> | Synthesize this stage into a cloud assembly. |

---

##### `toString` <a name="toString" id="aws-dsf.utils.ApplicationStage.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `synth` <a name="synth" id="aws-dsf.utils.ApplicationStage.synth"></a>

```typescript
public synth(options?: StageSynthesisOptions): CloudAssembly
```

Synthesize this stage into a cloud assembly.

Once an assembly has been synthesized, it cannot be modified. Subsequent
calls will return the same assembly.

###### `options`<sup>Optional</sup> <a name="options" id="aws-dsf.utils.ApplicationStage.synth.parameter.options"></a>

- *Type:* aws-cdk-lib.StageSynthesisOptions

---

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-dsf.utils.ApplicationStage.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |
| <code><a href="#aws-dsf.utils.ApplicationStage.isStage">isStage</a></code> | Test whether the given construct is a stage. |
| <code><a href="#aws-dsf.utils.ApplicationStage.of">of</a></code> | Return the stage this construct is contained with, if available. |

---

##### `isConstruct` <a name="isConstruct" id="aws-dsf.utils.ApplicationStage.isConstruct"></a>

```typescript
import { utils } from 'aws-dsf'

utils.ApplicationStage.isConstruct(x: any)
```

Checks if `x` is a construct.

Use this method instead of `instanceof` to properly detect `Construct`
instances, even when the construct library is symlinked.

Explanation: in JavaScript, multiple copies of the `constructs` library on
disk are seen as independent, completely different libraries. As a
consequence, the class `Construct` in each copy of the `constructs` library
is seen as a different class, and an instance of one class will not test as
`instanceof` the other class. `npm install` will not create installations
like this, but users may manually symlink construct libraries together or
use a monorepo tool: in those cases, multiple copies of the `constructs`
library can be accidentally installed, and `instanceof` will behave
unpredictably. It is safest to avoid using `instanceof`, and using
this type-testing method instead.

###### `x`<sup>Required</sup> <a name="x" id="aws-dsf.utils.ApplicationStage.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

##### `isStage` <a name="isStage" id="aws-dsf.utils.ApplicationStage.isStage"></a>

```typescript
import { utils } from 'aws-dsf'

utils.ApplicationStage.isStage(x: any)
```

Test whether the given construct is a stage.

###### `x`<sup>Required</sup> <a name="x" id="aws-dsf.utils.ApplicationStage.isStage.parameter.x"></a>

- *Type:* any

---

##### `of` <a name="of" id="aws-dsf.utils.ApplicationStage.of"></a>

```typescript
import { utils } from 'aws-dsf'

utils.ApplicationStage.of(construct: IConstruct)
```

Return the stage this construct is contained with, if available.

If called
on a nested stage, returns its parent.

###### `construct`<sup>Required</sup> <a name="construct" id="aws-dsf.utils.ApplicationStage.of.parameter.construct"></a>

- *Type:* constructs.IConstruct

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.utils.ApplicationStage.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#aws-dsf.utils.ApplicationStage.property.artifactId">artifactId</a></code> | <code>string</code> | Artifact ID of the assembly if it is a nested stage. The root stage (app) will return an empty string. |
| <code><a href="#aws-dsf.utils.ApplicationStage.property.assetOutdir">assetOutdir</a></code> | <code>string</code> | The cloud assembly asset output directory. |
| <code><a href="#aws-dsf.utils.ApplicationStage.property.outdir">outdir</a></code> | <code>string</code> | The cloud assembly output directory. |
| <code><a href="#aws-dsf.utils.ApplicationStage.property.policyValidationBeta1">policyValidationBeta1</a></code> | <code>aws-cdk-lib.IPolicyValidationPluginBeta1[]</code> | Validation plugins to run during synthesis. |
| <code><a href="#aws-dsf.utils.ApplicationStage.property.stageName">stageName</a></code> | <code>string</code> | The name of the stage. |
| <code><a href="#aws-dsf.utils.ApplicationStage.property.account">account</a></code> | <code>string</code> | The default account for all resources defined within this stage. |
| <code><a href="#aws-dsf.utils.ApplicationStage.property.parentStage">parentStage</a></code> | <code>aws-cdk-lib.Stage</code> | The parent stage or `undefined` if this is the app. |
| <code><a href="#aws-dsf.utils.ApplicationStage.property.region">region</a></code> | <code>string</code> | The default region for all resources defined within this stage. |
| <code><a href="#aws-dsf.utils.ApplicationStage.property.stackOutputsEnv">stackOutputsEnv</a></code> | <code>{[ key: string ]: aws-cdk-lib.CfnOutput}</code> | The list of CfnOutputs created by the CDK Stack. |

---

##### `node`<sup>Required</sup> <a name="node" id="aws-dsf.utils.ApplicationStage.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `artifactId`<sup>Required</sup> <a name="artifactId" id="aws-dsf.utils.ApplicationStage.property.artifactId"></a>

```typescript
public readonly artifactId: string;
```

- *Type:* string

Artifact ID of the assembly if it is a nested stage. The root stage (app) will return an empty string.

Derived from the construct path.

---

##### `assetOutdir`<sup>Required</sup> <a name="assetOutdir" id="aws-dsf.utils.ApplicationStage.property.assetOutdir"></a>

```typescript
public readonly assetOutdir: string;
```

- *Type:* string

The cloud assembly asset output directory.

---

##### `outdir`<sup>Required</sup> <a name="outdir" id="aws-dsf.utils.ApplicationStage.property.outdir"></a>

```typescript
public readonly outdir: string;
```

- *Type:* string

The cloud assembly output directory.

---

##### `policyValidationBeta1`<sup>Required</sup> <a name="policyValidationBeta1" id="aws-dsf.utils.ApplicationStage.property.policyValidationBeta1"></a>

```typescript
public readonly policyValidationBeta1: IPolicyValidationPluginBeta1[];
```

- *Type:* aws-cdk-lib.IPolicyValidationPluginBeta1[]
- *Default:* no validation plugins are used

Validation plugins to run during synthesis.

If any plugin reports any violation,
synthesis will be interrupted and the report displayed to the user.

---

##### `stageName`<sup>Required</sup> <a name="stageName" id="aws-dsf.utils.ApplicationStage.property.stageName"></a>

```typescript
public readonly stageName: string;
```

- *Type:* string

The name of the stage.

Based on names of the parent stages separated by
hypens.

---

##### `account`<sup>Optional</sup> <a name="account" id="aws-dsf.utils.ApplicationStage.property.account"></a>

```typescript
public readonly account: string;
```

- *Type:* string

The default account for all resources defined within this stage.

---

##### `parentStage`<sup>Optional</sup> <a name="parentStage" id="aws-dsf.utils.ApplicationStage.property.parentStage"></a>

```typescript
public readonly parentStage: Stage;
```

- *Type:* aws-cdk-lib.Stage

The parent stage or `undefined` if this is the app.

*

---

##### `region`<sup>Optional</sup> <a name="region" id="aws-dsf.utils.ApplicationStage.property.region"></a>

```typescript
public readonly region: string;
```

- *Type:* string

The default region for all resources defined within this stage.

---

##### `stackOutputsEnv`<sup>Optional</sup> <a name="stackOutputsEnv" id="aws-dsf.utils.ApplicationStage.property.stackOutputsEnv"></a>

```typescript
public readonly stackOutputsEnv: {[ key: string ]: CfnOutput};
```

- *Type:* {[ key: string ]: aws-cdk-lib.CfnOutput}

The list of CfnOutputs created by the CDK Stack.

---


### DataCatalogDatabase <a name="DataCatalogDatabase" id="aws-dsf.governance.DataCatalogDatabase"></a>

An AWS Glue Data Catalog Database configured with the location and a crawler.

> [https://awslabs.github.io/data-solutions-framework-on-aws/docs/constructs/library/data-catalog-database](https://awslabs.github.io/data-solutions-framework-on-aws/docs/constructs/library/data-catalog-database)

*Example*

```typescript
import { Bucket } from 'aws-cdk-lib/aws-s3';

new dsf.governance.DataCatalogDatabase(this, 'ExampleDatabase', {
   locationBucket: new Bucket(scope, 'LocationBucket'),
   locationPrefix: '/databasePath',
   name: 'example-db'
});
```


#### Initializers <a name="Initializers" id="aws-dsf.governance.DataCatalogDatabase.Initializer"></a>

```typescript
import { governance } from 'aws-dsf'

new governance.DataCatalogDatabase(scope: Construct, id: string, props: DataCatalogDatabaseProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.governance.DataCatalogDatabase.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | *No description.* |
| <code><a href="#aws-dsf.governance.DataCatalogDatabase.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#aws-dsf.governance.DataCatalogDatabase.Initializer.parameter.props">props</a></code> | <code>aws-dsf.governance.DataCatalogDatabaseProps</code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="aws-dsf.governance.DataCatalogDatabase.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="aws-dsf.governance.DataCatalogDatabase.Initializer.parameter.id"></a>

- *Type:* string

---

##### `props`<sup>Required</sup> <a name="props" id="aws-dsf.governance.DataCatalogDatabase.Initializer.parameter.props"></a>

- *Type:* aws-dsf.governance.DataCatalogDatabaseProps

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-dsf.governance.DataCatalogDatabase.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#aws-dsf.governance.DataCatalogDatabase.grantReadOnlyAccess">grantReadOnlyAccess</a></code> | Grants read access via identity based policy to the principal. |
| <code><a href="#aws-dsf.governance.DataCatalogDatabase.retrieveVersion">retrieveVersion</a></code> | Retrieve DSF package.json version. |

---

##### `toString` <a name="toString" id="aws-dsf.governance.DataCatalogDatabase.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `grantReadOnlyAccess` <a name="grantReadOnlyAccess" id="aws-dsf.governance.DataCatalogDatabase.grantReadOnlyAccess"></a>

```typescript
public grantReadOnlyAccess(principal: IPrincipal): AddToPrincipalPolicyResult
```

Grants read access via identity based policy to the principal.

This would attach an IAM policy to the principal allowing read access to the database and all its tables.

###### `principal`<sup>Required</sup> <a name="principal" id="aws-dsf.governance.DataCatalogDatabase.grantReadOnlyAccess.parameter.principal"></a>

- *Type:* aws-cdk-lib.aws_iam.IPrincipal

Principal to attach the database read access to.

---

##### `retrieveVersion` <a name="retrieveVersion" id="aws-dsf.governance.DataCatalogDatabase.retrieveVersion"></a>

```typescript
public retrieveVersion(): any
```

Retrieve DSF package.json version.

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-dsf.governance.DataCatalogDatabase.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |

---

##### `isConstruct` <a name="isConstruct" id="aws-dsf.governance.DataCatalogDatabase.isConstruct"></a>

```typescript
import { governance } from 'aws-dsf'

governance.DataCatalogDatabase.isConstruct(x: any)
```

Checks if `x` is a construct.

Use this method instead of `instanceof` to properly detect `Construct`
instances, even when the construct library is symlinked.

Explanation: in JavaScript, multiple copies of the `constructs` library on
disk are seen as independent, completely different libraries. As a
consequence, the class `Construct` in each copy of the `constructs` library
is seen as a different class, and an instance of one class will not test as
`instanceof` the other class. `npm install` will not create installations
like this, but users may manually symlink construct libraries together or
use a monorepo tool: in those cases, multiple copies of the `constructs`
library can be accidentally installed, and `instanceof` will behave
unpredictably. It is safest to avoid using `instanceof`, and using
this type-testing method instead.

###### `x`<sup>Required</sup> <a name="x" id="aws-dsf.governance.DataCatalogDatabase.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.governance.DataCatalogDatabase.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#aws-dsf.governance.DataCatalogDatabase.property.database">database</a></code> | <code>aws-cdk-lib.aws_glue.CfnDatabase</code> | The Glue database that's created. |
| <code><a href="#aws-dsf.governance.DataCatalogDatabase.property.databaseName">databaseName</a></code> | <code>string</code> | The Glue database name with the randomized suffix to prevent name collisions in the catalog. |
| <code><a href="#aws-dsf.governance.DataCatalogDatabase.property.crawler">crawler</a></code> | <code>aws-cdk-lib.aws_glue.CfnCrawler</code> | The Glue Crawler that is automatically created when `autoCrawl` is set to `true` (default value). |
| <code><a href="#aws-dsf.governance.DataCatalogDatabase.property.crawlerLogEncryptionKey">crawlerLogEncryptionKey</a></code> | <code>aws-cdk-lib.aws_kms.IKey</code> | KMS encryption key used by the Crawler. |
| <code><a href="#aws-dsf.governance.DataCatalogDatabase.property.crawlerRole">crawlerRole</a></code> | <code>aws-cdk-lib.aws_iam.IRole</code> | The IAM role used by the Glue crawler when created. |
| <code><a href="#aws-dsf.governance.DataCatalogDatabase.property.crawlerSecurityConfiguration">crawlerSecurityConfiguration</a></code> | <code>aws-cdk-lib.aws_glue.CfnSecurityConfiguration</code> | The Glue security configuration used by the Glue Crawler when created. |

---

##### `node`<sup>Required</sup> <a name="node" id="aws-dsf.governance.DataCatalogDatabase.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `database`<sup>Required</sup> <a name="database" id="aws-dsf.governance.DataCatalogDatabase.property.database"></a>

```typescript
public readonly database: CfnDatabase;
```

- *Type:* aws-cdk-lib.aws_glue.CfnDatabase

The Glue database that's created.

---

##### `databaseName`<sup>Required</sup> <a name="databaseName" id="aws-dsf.governance.DataCatalogDatabase.property.databaseName"></a>

```typescript
public readonly databaseName: string;
```

- *Type:* string

The Glue database name with the randomized suffix to prevent name collisions in the catalog.

---

##### `crawler`<sup>Optional</sup> <a name="crawler" id="aws-dsf.governance.DataCatalogDatabase.property.crawler"></a>

```typescript
public readonly crawler: CfnCrawler;
```

- *Type:* aws-cdk-lib.aws_glue.CfnCrawler

The Glue Crawler that is automatically created when `autoCrawl` is set to `true` (default value).

This property can be undefined if `autoCrawl` is set to `false`.

---

##### `crawlerLogEncryptionKey`<sup>Optional</sup> <a name="crawlerLogEncryptionKey" id="aws-dsf.governance.DataCatalogDatabase.property.crawlerLogEncryptionKey"></a>

```typescript
public readonly crawlerLogEncryptionKey: IKey;
```

- *Type:* aws-cdk-lib.aws_kms.IKey

KMS encryption key used by the Crawler.

---

##### `crawlerRole`<sup>Optional</sup> <a name="crawlerRole" id="aws-dsf.governance.DataCatalogDatabase.property.crawlerRole"></a>

```typescript
public readonly crawlerRole: IRole;
```

- *Type:* aws-cdk-lib.aws_iam.IRole

The IAM role used by the Glue crawler when created.

---

##### `crawlerSecurityConfiguration`<sup>Optional</sup> <a name="crawlerSecurityConfiguration" id="aws-dsf.governance.DataCatalogDatabase.property.crawlerSecurityConfiguration"></a>

```typescript
public readonly crawlerSecurityConfiguration: CfnSecurityConfiguration;
```

- *Type:* aws-cdk-lib.aws_glue.CfnSecurityConfiguration

The Glue security configuration used by the Glue Crawler when created.

---

#### Constants <a name="Constants" id="Constants"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.governance.DataCatalogDatabase.property.DSF_OWNED_TAG">DSF_OWNED_TAG</a></code> | <code>string</code> | *No description.* |
| <code><a href="#aws-dsf.governance.DataCatalogDatabase.property.DSF_TRACKING_CODE">DSF_TRACKING_CODE</a></code> | <code>string</code> | *No description.* |

---

##### `DSF_OWNED_TAG`<sup>Required</sup> <a name="DSF_OWNED_TAG" id="aws-dsf.governance.DataCatalogDatabase.property.DSF_OWNED_TAG"></a>

```typescript
public readonly DSF_OWNED_TAG: string;
```

- *Type:* string

---

##### `DSF_TRACKING_CODE`<sup>Required</sup> <a name="DSF_TRACKING_CODE" id="aws-dsf.governance.DataCatalogDatabase.property.DSF_TRACKING_CODE"></a>

```typescript
public readonly DSF_TRACKING_CODE: string;
```

- *Type:* string

---

### DataLakeCatalog <a name="DataLakeCatalog" id="aws-dsf.governance.DataLakeCatalog"></a>

Creates AWS Glue Catalog Database for each storage layer.

Composed of 3 {@link DataCatalogDatabase} for Bronze, Silver, and Gold data.

> [https://awslabs.github.io/data-solutions-framework-on-aws/docs/constructs/library/data-lake-catalog](https://awslabs.github.io/data-solutions-framework-on-aws/docs/constructs/library/data-lake-catalog)

*Example*

```typescript
import { Key } from 'aws-cdk-lib/aws-kms';

const logEncryptionKey = new Key(this, 'LogEncryptionKey');
const storage = new dsf.storage.DataLakeStorage(this, "ExampleStorage");
const dataLakeCatalog = new dsf.governance.DataLakeCatalog(this, "ExampleDataLakeCatalog", {
  dataLakeStorage: storage,
  databaseName: "exampledb",
  crawlerLogEncryptionKey: logEncryptionKey
})
```


#### Initializers <a name="Initializers" id="aws-dsf.governance.DataLakeCatalog.Initializer"></a>

```typescript
import { governance } from 'aws-dsf'

new governance.DataLakeCatalog(scope: Construct, id: string, props: DataLakeCatalogProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.governance.DataLakeCatalog.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | the Scope of the CDK Construct. |
| <code><a href="#aws-dsf.governance.DataLakeCatalog.Initializer.parameter.id">id</a></code> | <code>string</code> | the ID of the CDK Construct. |
| <code><a href="#aws-dsf.governance.DataLakeCatalog.Initializer.parameter.props">props</a></code> | <code>aws-dsf.governance.DataLakeCatalogProps</code> | the DataLakeCatalog properties. |

---

##### `scope`<sup>Required</sup> <a name="scope" id="aws-dsf.governance.DataLakeCatalog.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

the Scope of the CDK Construct.

---

##### `id`<sup>Required</sup> <a name="id" id="aws-dsf.governance.DataLakeCatalog.Initializer.parameter.id"></a>

- *Type:* string

the ID of the CDK Construct.

---

##### `props`<sup>Required</sup> <a name="props" id="aws-dsf.governance.DataLakeCatalog.Initializer.parameter.props"></a>

- *Type:* aws-dsf.governance.DataLakeCatalogProps

the DataLakeCatalog properties.

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-dsf.governance.DataLakeCatalog.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#aws-dsf.governance.DataLakeCatalog.retrieveVersion">retrieveVersion</a></code> | Retrieve DSF package.json version. |

---

##### `toString` <a name="toString" id="aws-dsf.governance.DataLakeCatalog.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `retrieveVersion` <a name="retrieveVersion" id="aws-dsf.governance.DataLakeCatalog.retrieveVersion"></a>

```typescript
public retrieveVersion(): any
```

Retrieve DSF package.json version.

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-dsf.governance.DataLakeCatalog.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |

---

##### `isConstruct` <a name="isConstruct" id="aws-dsf.governance.DataLakeCatalog.isConstruct"></a>

```typescript
import { governance } from 'aws-dsf'

governance.DataLakeCatalog.isConstruct(x: any)
```

Checks if `x` is a construct.

Use this method instead of `instanceof` to properly detect `Construct`
instances, even when the construct library is symlinked.

Explanation: in JavaScript, multiple copies of the `constructs` library on
disk are seen as independent, completely different libraries. As a
consequence, the class `Construct` in each copy of the `constructs` library
is seen as a different class, and an instance of one class will not test as
`instanceof` the other class. `npm install` will not create installations
like this, but users may manually symlink construct libraries together or
use a monorepo tool: in those cases, multiple copies of the `constructs`
library can be accidentally installed, and `instanceof` will behave
unpredictably. It is safest to avoid using `instanceof`, and using
this type-testing method instead.

###### `x`<sup>Required</sup> <a name="x" id="aws-dsf.governance.DataLakeCatalog.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.governance.DataLakeCatalog.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#aws-dsf.governance.DataLakeCatalog.property.bronzeCatalogDatabase">bronzeCatalogDatabase</a></code> | <code>aws-dsf.governance.DataCatalogDatabase</code> | The Glue Database for Bronze bucket. |
| <code><a href="#aws-dsf.governance.DataLakeCatalog.property.goldCatalogDatabase">goldCatalogDatabase</a></code> | <code>aws-dsf.governance.DataCatalogDatabase</code> | The Glue Database for Gold bucket. |
| <code><a href="#aws-dsf.governance.DataLakeCatalog.property.silverCatalogDatabase">silverCatalogDatabase</a></code> | <code>aws-dsf.governance.DataCatalogDatabase</code> | The Glue Database for Silver bucket. |
| <code><a href="#aws-dsf.governance.DataLakeCatalog.property.crawlerLogEncryptionKey">crawlerLogEncryptionKey</a></code> | <code>aws-cdk-lib.aws_kms.IKey</code> | The KMS Key used to encrypt the crawler logs. |

---

##### `node`<sup>Required</sup> <a name="node" id="aws-dsf.governance.DataLakeCatalog.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `bronzeCatalogDatabase`<sup>Required</sup> <a name="bronzeCatalogDatabase" id="aws-dsf.governance.DataLakeCatalog.property.bronzeCatalogDatabase"></a>

```typescript
public readonly bronzeCatalogDatabase: DataCatalogDatabase;
```

- *Type:* aws-dsf.governance.DataCatalogDatabase

The Glue Database for Bronze bucket.

---

##### `goldCatalogDatabase`<sup>Required</sup> <a name="goldCatalogDatabase" id="aws-dsf.governance.DataLakeCatalog.property.goldCatalogDatabase"></a>

```typescript
public readonly goldCatalogDatabase: DataCatalogDatabase;
```

- *Type:* aws-dsf.governance.DataCatalogDatabase

The Glue Database for Gold bucket.

---

##### `silverCatalogDatabase`<sup>Required</sup> <a name="silverCatalogDatabase" id="aws-dsf.governance.DataLakeCatalog.property.silverCatalogDatabase"></a>

```typescript
public readonly silverCatalogDatabase: DataCatalogDatabase;
```

- *Type:* aws-dsf.governance.DataCatalogDatabase

The Glue Database for Silver bucket.

---

##### `crawlerLogEncryptionKey`<sup>Optional</sup> <a name="crawlerLogEncryptionKey" id="aws-dsf.governance.DataLakeCatalog.property.crawlerLogEncryptionKey"></a>

```typescript
public readonly crawlerLogEncryptionKey: IKey;
```

- *Type:* aws-cdk-lib.aws_kms.IKey

The KMS Key used to encrypt the crawler logs.

---

#### Constants <a name="Constants" id="Constants"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.governance.DataLakeCatalog.property.DSF_OWNED_TAG">DSF_OWNED_TAG</a></code> | <code>string</code> | *No description.* |
| <code><a href="#aws-dsf.governance.DataLakeCatalog.property.DSF_TRACKING_CODE">DSF_TRACKING_CODE</a></code> | <code>string</code> | *No description.* |

---

##### `DSF_OWNED_TAG`<sup>Required</sup> <a name="DSF_OWNED_TAG" id="aws-dsf.governance.DataLakeCatalog.property.DSF_OWNED_TAG"></a>

```typescript
public readonly DSF_OWNED_TAG: string;
```

- *Type:* string

---

##### `DSF_TRACKING_CODE`<sup>Required</sup> <a name="DSF_TRACKING_CODE" id="aws-dsf.governance.DataLakeCatalog.property.DSF_TRACKING_CODE"></a>

```typescript
public readonly DSF_TRACKING_CODE: string;
```

- *Type:* string

---

### DataLakeStorage <a name="DataLakeStorage" id="aws-dsf.storage.DataLakeStorage"></a>

Creates the storage layer for a data lake, composed of 3 {@link AnalyticsBucket} for Bronze, Silver, and Gold data.

> [https://awslabs.github.io/data-solutions-framework-on-aws/docs/constructs/library/data-lake-storage](https://awslabs.github.io/data-solutions-framework-on-aws/docs/constructs/library/data-lake-storage)

*Example*

```typescript
// Set the context value for global data removal policy
this.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

new dsf.storage.DataLakeStorage(this, 'MyDataLakeStorage', {
 bronzeBucketName: 'my-bronze',
 bronzeBucketInfrequentAccessDelay: 90,
 bronzeBucketArchiveDelay: 180,
 silverBucketName: 'my-silver',
 silverBucketInfrequentAccessDelay: 180,
 silverBucketArchiveDelay: 360,
 goldBucketName: 'my-gold',
 goldBucketInfrequentAccessDelay: 180,
 goldBucketArchiveDelay: 360,
 removalPolicy: cdk.RemovalPolicy.DESTROY,
});
```


#### Initializers <a name="Initializers" id="aws-dsf.storage.DataLakeStorage.Initializer"></a>

```typescript
import { storage } from 'aws-dsf'

new storage.DataLakeStorage(scope: Construct, id: string, props?: DataLakeStorageProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.storage.DataLakeStorage.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | the Scope of the CDK Construct. |
| <code><a href="#aws-dsf.storage.DataLakeStorage.Initializer.parameter.id">id</a></code> | <code>string</code> | the ID of the CDK Construct. |
| <code><a href="#aws-dsf.storage.DataLakeStorage.Initializer.parameter.props">props</a></code> | <code>aws-dsf.storage.DataLakeStorageProps</code> | the DataLakeStorageProps properties. |

---

##### `scope`<sup>Required</sup> <a name="scope" id="aws-dsf.storage.DataLakeStorage.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

the Scope of the CDK Construct.

---

##### `id`<sup>Required</sup> <a name="id" id="aws-dsf.storage.DataLakeStorage.Initializer.parameter.id"></a>

- *Type:* string

the ID of the CDK Construct.

---

##### `props`<sup>Optional</sup> <a name="props" id="aws-dsf.storage.DataLakeStorage.Initializer.parameter.props"></a>

- *Type:* aws-dsf.storage.DataLakeStorageProps

the DataLakeStorageProps properties.

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-dsf.storage.DataLakeStorage.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#aws-dsf.storage.DataLakeStorage.retrieveVersion">retrieveVersion</a></code> | Retrieve DSF package.json version. |

---

##### `toString` <a name="toString" id="aws-dsf.storage.DataLakeStorage.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `retrieveVersion` <a name="retrieveVersion" id="aws-dsf.storage.DataLakeStorage.retrieveVersion"></a>

```typescript
public retrieveVersion(): any
```

Retrieve DSF package.json version.

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-dsf.storage.DataLakeStorage.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |

---

##### `isConstruct` <a name="isConstruct" id="aws-dsf.storage.DataLakeStorage.isConstruct"></a>

```typescript
import { storage } from 'aws-dsf'

storage.DataLakeStorage.isConstruct(x: any)
```

Checks if `x` is a construct.

Use this method instead of `instanceof` to properly detect `Construct`
instances, even when the construct library is symlinked.

Explanation: in JavaScript, multiple copies of the `constructs` library on
disk are seen as independent, completely different libraries. As a
consequence, the class `Construct` in each copy of the `constructs` library
is seen as a different class, and an instance of one class will not test as
`instanceof` the other class. `npm install` will not create installations
like this, but users may manually symlink construct libraries together or
use a monorepo tool: in those cases, multiple copies of the `constructs`
library can be accidentally installed, and `instanceof` will behave
unpredictably. It is safest to avoid using `instanceof`, and using
this type-testing method instead.

###### `x`<sup>Required</sup> <a name="x" id="aws-dsf.storage.DataLakeStorage.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.storage.DataLakeStorage.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#aws-dsf.storage.DataLakeStorage.property.accessLogsBucket">accessLogsBucket</a></code> | <code>aws-dsf.storage.AccessLogsBucket</code> | The S3 Bucket for access logs. |
| <code><a href="#aws-dsf.storage.DataLakeStorage.property.bronzeBucket">bronzeBucket</a></code> | <code>aws-dsf.storage.AnalyticsBucket</code> | The S3 Bucket for Bronze layer. |
| <code><a href="#aws-dsf.storage.DataLakeStorage.property.dataLakeKey">dataLakeKey</a></code> | <code>aws-cdk-lib.aws_kms.IKey</code> | The KMS Key used to encrypt all DataLakeStorage S3 buckets. |
| <code><a href="#aws-dsf.storage.DataLakeStorage.property.goldBucket">goldBucket</a></code> | <code>aws-dsf.storage.AnalyticsBucket</code> | The S3 Bucket for Gold layer. |
| <code><a href="#aws-dsf.storage.DataLakeStorage.property.silverBucket">silverBucket</a></code> | <code>aws-dsf.storage.AnalyticsBucket</code> | The S3 Bucket for Silver layer. |

---

##### `node`<sup>Required</sup> <a name="node" id="aws-dsf.storage.DataLakeStorage.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `accessLogsBucket`<sup>Required</sup> <a name="accessLogsBucket" id="aws-dsf.storage.DataLakeStorage.property.accessLogsBucket"></a>

```typescript
public readonly accessLogsBucket: AccessLogsBucket;
```

- *Type:* aws-dsf.storage.AccessLogsBucket

The S3 Bucket for access logs.

---

##### `bronzeBucket`<sup>Required</sup> <a name="bronzeBucket" id="aws-dsf.storage.DataLakeStorage.property.bronzeBucket"></a>

```typescript
public readonly bronzeBucket: AnalyticsBucket;
```

- *Type:* aws-dsf.storage.AnalyticsBucket

The S3 Bucket for Bronze layer.

---

##### `dataLakeKey`<sup>Required</sup> <a name="dataLakeKey" id="aws-dsf.storage.DataLakeStorage.property.dataLakeKey"></a>

```typescript
public readonly dataLakeKey: IKey;
```

- *Type:* aws-cdk-lib.aws_kms.IKey

The KMS Key used to encrypt all DataLakeStorage S3 buckets.

---

##### `goldBucket`<sup>Required</sup> <a name="goldBucket" id="aws-dsf.storage.DataLakeStorage.property.goldBucket"></a>

```typescript
public readonly goldBucket: AnalyticsBucket;
```

- *Type:* aws-dsf.storage.AnalyticsBucket

The S3 Bucket for Gold layer.

---

##### `silverBucket`<sup>Required</sup> <a name="silverBucket" id="aws-dsf.storage.DataLakeStorage.property.silverBucket"></a>

```typescript
public readonly silverBucket: AnalyticsBucket;
```

- *Type:* aws-dsf.storage.AnalyticsBucket

The S3 Bucket for Silver layer.

---

#### Constants <a name="Constants" id="Constants"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.storage.DataLakeStorage.property.DSF_OWNED_TAG">DSF_OWNED_TAG</a></code> | <code>string</code> | *No description.* |
| <code><a href="#aws-dsf.storage.DataLakeStorage.property.DSF_TRACKING_CODE">DSF_TRACKING_CODE</a></code> | <code>string</code> | *No description.* |

---

##### `DSF_OWNED_TAG`<sup>Required</sup> <a name="DSF_OWNED_TAG" id="aws-dsf.storage.DataLakeStorage.property.DSF_OWNED_TAG"></a>

```typescript
public readonly DSF_OWNED_TAG: string;
```

- *Type:* string

---

##### `DSF_TRACKING_CODE`<sup>Required</sup> <a name="DSF_TRACKING_CODE" id="aws-dsf.storage.DataLakeStorage.property.DSF_TRACKING_CODE"></a>

```typescript
public readonly DSF_TRACKING_CODE: string;
```

- *Type:* string

---

### DataVpc <a name="DataVpc" id="aws-dsf.utils.DataVpc"></a>

#### Initializers <a name="Initializers" id="aws-dsf.utils.DataVpc.Initializer"></a>

```typescript
import { utils } from 'aws-dsf'

new utils.DataVpc(scope: Construct, id: string, props: DataVpcProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.utils.DataVpc.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | *No description.* |
| <code><a href="#aws-dsf.utils.DataVpc.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#aws-dsf.utils.DataVpc.Initializer.parameter.props">props</a></code> | <code>aws-dsf.utils.DataVpcProps</code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="aws-dsf.utils.DataVpc.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="aws-dsf.utils.DataVpc.Initializer.parameter.id"></a>

- *Type:* string

---

##### `props`<sup>Required</sup> <a name="props" id="aws-dsf.utils.DataVpc.Initializer.parameter.props"></a>

- *Type:* aws-dsf.utils.DataVpcProps

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-dsf.utils.DataVpc.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#aws-dsf.utils.DataVpc.tagVpc">tagVpc</a></code> | Tag the VPC and the subnets. |

---

##### `toString` <a name="toString" id="aws-dsf.utils.DataVpc.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `tagVpc` <a name="tagVpc" id="aws-dsf.utils.DataVpc.tagVpc"></a>

```typescript
public tagVpc(key: string, value: string): void
```

Tag the VPC and the subnets.

###### `key`<sup>Required</sup> <a name="key" id="aws-dsf.utils.DataVpc.tagVpc.parameter.key"></a>

- *Type:* string

the tag key.

---

###### `value`<sup>Required</sup> <a name="value" id="aws-dsf.utils.DataVpc.tagVpc.parameter.value"></a>

- *Type:* string

the tag value.

---

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-dsf.utils.DataVpc.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |

---

##### `isConstruct` <a name="isConstruct" id="aws-dsf.utils.DataVpc.isConstruct"></a>

```typescript
import { utils } from 'aws-dsf'

utils.DataVpc.isConstruct(x: any)
```

Checks if `x` is a construct.

Use this method instead of `instanceof` to properly detect `Construct`
instances, even when the construct library is symlinked.

Explanation: in JavaScript, multiple copies of the `constructs` library on
disk are seen as independent, completely different libraries. As a
consequence, the class `Construct` in each copy of the `constructs` library
is seen as a different class, and an instance of one class will not test as
`instanceof` the other class. `npm install` will not create installations
like this, but users may manually symlink construct libraries together or
use a monorepo tool: in those cases, multiple copies of the `constructs`
library can be accidentally installed, and `instanceof` will behave
unpredictably. It is safest to avoid using `instanceof`, and using
this type-testing method instead.

###### `x`<sup>Required</sup> <a name="x" id="aws-dsf.utils.DataVpc.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.utils.DataVpc.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#aws-dsf.utils.DataVpc.property.flowLogGroup">flowLogGroup</a></code> | <code>aws-cdk-lib.aws_logs.ILogGroup</code> | The CloudWatch Log Group created for the VPC flow logs. |
| <code><a href="#aws-dsf.utils.DataVpc.property.flowLogKey">flowLogKey</a></code> | <code>aws-cdk-lib.aws_kms.IKey</code> | The KMS Key used to encrypt VPC flow logs. |
| <code><a href="#aws-dsf.utils.DataVpc.property.flowLogRole">flowLogRole</a></code> | <code>aws-cdk-lib.aws_iam.IRole</code> | The IAM role used to publish VPC Flow Logs. |
| <code><a href="#aws-dsf.utils.DataVpc.property.s3VpcEndpoint">s3VpcEndpoint</a></code> | <code>aws-cdk-lib.aws_ec2.IGatewayVpcEndpoint</code> | The S3 VPC endpoint gateway. |
| <code><a href="#aws-dsf.utils.DataVpc.property.vpc">vpc</a></code> | <code>aws-cdk-lib.aws_ec2.IVpc</code> | The amazon VPC created. |

---

##### `node`<sup>Required</sup> <a name="node" id="aws-dsf.utils.DataVpc.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `flowLogGroup`<sup>Required</sup> <a name="flowLogGroup" id="aws-dsf.utils.DataVpc.property.flowLogGroup"></a>

```typescript
public readonly flowLogGroup: ILogGroup;
```

- *Type:* aws-cdk-lib.aws_logs.ILogGroup

The CloudWatch Log Group created for the VPC flow logs.

---

##### `flowLogKey`<sup>Required</sup> <a name="flowLogKey" id="aws-dsf.utils.DataVpc.property.flowLogKey"></a>

```typescript
public readonly flowLogKey: IKey;
```

- *Type:* aws-cdk-lib.aws_kms.IKey

The KMS Key used to encrypt VPC flow logs.

---

##### `flowLogRole`<sup>Required</sup> <a name="flowLogRole" id="aws-dsf.utils.DataVpc.property.flowLogRole"></a>

```typescript
public readonly flowLogRole: IRole;
```

- *Type:* aws-cdk-lib.aws_iam.IRole

The IAM role used to publish VPC Flow Logs.

---

##### `s3VpcEndpoint`<sup>Required</sup> <a name="s3VpcEndpoint" id="aws-dsf.utils.DataVpc.property.s3VpcEndpoint"></a>

```typescript
public readonly s3VpcEndpoint: IGatewayVpcEndpoint;
```

- *Type:* aws-cdk-lib.aws_ec2.IGatewayVpcEndpoint

The S3 VPC endpoint gateway.

---

##### `vpc`<sup>Required</sup> <a name="vpc" id="aws-dsf.utils.DataVpc.property.vpc"></a>

```typescript
public readonly vpc: IVpc;
```

- *Type:* aws-cdk-lib.aws_ec2.IVpc

The amazon VPC created.

---


### PySparkApplicationPackage <a name="PySparkApplicationPackage" id="aws-dsf.processing.PySparkApplicationPackage"></a>

A construct that takes your PySpark application, packages its virtual environment and uploads it along its entrypoint to an Amazon S3 bucket This construct requires Docker daemon installed locally to run.

> [https://awslabs.github.io/data-solutions-framework-on-aws/docs/constructs/library/pyspark-application-package](https://awslabs.github.io/data-solutions-framework-on-aws/docs/constructs/library/pyspark-application-package)

*Example*

```typescript
let pysparkPacker = new dsf.processing.PySparkApplicationPackage (this, 'pysparkPacker', {
  applicationName: 'my-pyspark',
  entrypointPath: '/Users/my-user/my-spark-job/app/app-pyspark.py',
  dependenciesFolder: '/Users/my-user/my-spark-job/app',
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

let sparkEnvConf: string = `--conf spark.archives=${pysparkPacker.venvArchiveS3Uri} --conf spark.emr-serverless.driverEnv.PYSPARK_DRIVER_PYTHON=./environment/bin/python --conf spark.emr-serverless.driverEnv.PYSPARK_PYTHON=./environment/bin/python --conf spark.emr-serverless.executorEnv.PYSPARK_PYTHON=./environment/bin/python`

new dsf.processing.SparkEmrServerlessJob(this, 'SparkJobServerless', {
  name: 'MyPySpark',
  applicationId: 'xxxxxxxxx',
  executionRoleArn: 'ROLE-ARN',
  executionTimeoutMinutes: 30,
  s3LogUri: 's3://s3-bucket/monitoring-logs',
  cloudWatchLogGroupName: 'my-pyspark-serverless-log',
  sparkSubmitEntryPoint: `${pysparkPacker.entrypointS3Uri}`,
  sparkSubmitParameters: `--conf spark.executor.instances=2 --conf spark.executor.memory=2G --conf spark.driver.memory=2G --conf spark.executor.cores=4 ${sparkEnvConf}`,
} as dsf.processing.SparkEmrServerlessJobProps);
```


#### Initializers <a name="Initializers" id="aws-dsf.processing.PySparkApplicationPackage.Initializer"></a>

```typescript
import { processing } from 'aws-dsf'

new processing.PySparkApplicationPackage(scope: Construct, id: string, props: PySparkApplicationPackageProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.processing.PySparkApplicationPackage.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | the Scope of the CDK Construct. |
| <code><a href="#aws-dsf.processing.PySparkApplicationPackage.Initializer.parameter.id">id</a></code> | <code>string</code> | the ID of the CDK Construct. |
| <code><a href="#aws-dsf.processing.PySparkApplicationPackage.Initializer.parameter.props">props</a></code> | <code>aws-dsf.processing.PySparkApplicationPackageProps</code> | {@link PySparkApplicationPackageProps}. |

---

##### `scope`<sup>Required</sup> <a name="scope" id="aws-dsf.processing.PySparkApplicationPackage.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

the Scope of the CDK Construct.

---

##### `id`<sup>Required</sup> <a name="id" id="aws-dsf.processing.PySparkApplicationPackage.Initializer.parameter.id"></a>

- *Type:* string

the ID of the CDK Construct.

---

##### `props`<sup>Required</sup> <a name="props" id="aws-dsf.processing.PySparkApplicationPackage.Initializer.parameter.props"></a>

- *Type:* aws-dsf.processing.PySparkApplicationPackageProps

{@link PySparkApplicationPackageProps}.

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-dsf.processing.PySparkApplicationPackage.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#aws-dsf.processing.PySparkApplicationPackage.retrieveVersion">retrieveVersion</a></code> | Retrieve DSF package.json version. |

---

##### `toString` <a name="toString" id="aws-dsf.processing.PySparkApplicationPackage.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `retrieveVersion` <a name="retrieveVersion" id="aws-dsf.processing.PySparkApplicationPackage.retrieveVersion"></a>

```typescript
public retrieveVersion(): any
```

Retrieve DSF package.json version.

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-dsf.processing.PySparkApplicationPackage.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |

---

##### `isConstruct` <a name="isConstruct" id="aws-dsf.processing.PySparkApplicationPackage.isConstruct"></a>

```typescript
import { processing } from 'aws-dsf'

processing.PySparkApplicationPackage.isConstruct(x: any)
```

Checks if `x` is a construct.

Use this method instead of `instanceof` to properly detect `Construct`
instances, even when the construct library is symlinked.

Explanation: in JavaScript, multiple copies of the `constructs` library on
disk are seen as independent, completely different libraries. As a
consequence, the class `Construct` in each copy of the `constructs` library
is seen as a different class, and an instance of one class will not test as
`instanceof` the other class. `npm install` will not create installations
like this, but users may manually symlink construct libraries together or
use a monorepo tool: in those cases, multiple copies of the `constructs`
library can be accidentally installed, and `instanceof` will behave
unpredictably. It is safest to avoid using `instanceof`, and using
this type-testing method instead.

###### `x`<sup>Required</sup> <a name="x" id="aws-dsf.processing.PySparkApplicationPackage.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.processing.PySparkApplicationPackage.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#aws-dsf.processing.PySparkApplicationPackage.property.artifactsBucket">artifactsBucket</a></code> | <code>aws-cdk-lib.aws_s3.IBucket</code> | The bucket storing the artifacts (entrypoint and virtual environment archive). |
| <code><a href="#aws-dsf.processing.PySparkApplicationPackage.property.assetUploadManagedPolicy">assetUploadManagedPolicy</a></code> | <code>aws-cdk-lib.aws_iam.IManagedPolicy</code> | The IAM managed policy used by the custom resource for the assets deployment. |
| <code><a href="#aws-dsf.processing.PySparkApplicationPackage.property.assetUploadRole">assetUploadRole</a></code> | <code>aws-cdk-lib.aws_iam.IRole</code> | The role used by the BucketDeployment to upload the artifacts to an s3 bucket. |
| <code><a href="#aws-dsf.processing.PySparkApplicationPackage.property.entrypointS3Uri">entrypointS3Uri</a></code> | <code>string</code> | The S3 location where the entry point is saved in S3. |
| <code><a href="#aws-dsf.processing.PySparkApplicationPackage.property.sparkVenvConf">sparkVenvConf</a></code> | <code>string</code> | The Spark config containing the configuration of virtual environment archive with all dependencies. |
| <code><a href="#aws-dsf.processing.PySparkApplicationPackage.property.venvArchiveS3Uri">venvArchiveS3Uri</a></code> | <code>string</code> | The S3 location where the archive of the Python virtual environment with all dependencies is stored. |

---

##### `node`<sup>Required</sup> <a name="node" id="aws-dsf.processing.PySparkApplicationPackage.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `artifactsBucket`<sup>Required</sup> <a name="artifactsBucket" id="aws-dsf.processing.PySparkApplicationPackage.property.artifactsBucket"></a>

```typescript
public readonly artifactsBucket: IBucket;
```

- *Type:* aws-cdk-lib.aws_s3.IBucket

The bucket storing the artifacts (entrypoint and virtual environment archive).

---

##### `assetUploadManagedPolicy`<sup>Required</sup> <a name="assetUploadManagedPolicy" id="aws-dsf.processing.PySparkApplicationPackage.property.assetUploadManagedPolicy"></a>

```typescript
public readonly assetUploadManagedPolicy: IManagedPolicy;
```

- *Type:* aws-cdk-lib.aws_iam.IManagedPolicy

The IAM managed policy used by the custom resource for the assets deployment.

---

##### `assetUploadRole`<sup>Required</sup> <a name="assetUploadRole" id="aws-dsf.processing.PySparkApplicationPackage.property.assetUploadRole"></a>

```typescript
public readonly assetUploadRole: IRole;
```

- *Type:* aws-cdk-lib.aws_iam.IRole

The role used by the BucketDeployment to upload the artifacts to an s3 bucket.

In case you provide your own bucket for storing the artifacts (entrypoint and virtual environment archive),
you must provide s3 write access to this role to upload the artifacts.

---

##### `entrypointS3Uri`<sup>Required</sup> <a name="entrypointS3Uri" id="aws-dsf.processing.PySparkApplicationPackage.property.entrypointS3Uri"></a>

```typescript
public readonly entrypointS3Uri: string;
```

- *Type:* string

The S3 location where the entry point is saved in S3.

You pass this location to your Spark job.

---

##### `sparkVenvConf`<sup>Optional</sup> <a name="sparkVenvConf" id="aws-dsf.processing.PySparkApplicationPackage.property.sparkVenvConf"></a>

```typescript
public readonly sparkVenvConf: string;
```

- *Type:* string

The Spark config containing the configuration of virtual environment archive with all dependencies.

---

##### `venvArchiveS3Uri`<sup>Optional</sup> <a name="venvArchiveS3Uri" id="aws-dsf.processing.PySparkApplicationPackage.property.venvArchiveS3Uri"></a>

```typescript
public readonly venvArchiveS3Uri: string;
```

- *Type:* string

The S3 location where the archive of the Python virtual environment with all dependencies is stored.

You pass this location to your Spark job.

---

#### Constants <a name="Constants" id="Constants"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.processing.PySparkApplicationPackage.property.ARTIFACTS_PREFIX">ARTIFACTS_PREFIX</a></code> | <code>string</code> | The prefix used to store artifacts on the artifact bucket. |
| <code><a href="#aws-dsf.processing.PySparkApplicationPackage.property.DSF_OWNED_TAG">DSF_OWNED_TAG</a></code> | <code>string</code> | *No description.* |
| <code><a href="#aws-dsf.processing.PySparkApplicationPackage.property.DSF_TRACKING_CODE">DSF_TRACKING_CODE</a></code> | <code>string</code> | *No description.* |

---

##### `ARTIFACTS_PREFIX`<sup>Required</sup> <a name="ARTIFACTS_PREFIX" id="aws-dsf.processing.PySparkApplicationPackage.property.ARTIFACTS_PREFIX"></a>

```typescript
public readonly ARTIFACTS_PREFIX: string;
```

- *Type:* string

The prefix used to store artifacts on the artifact bucket.

---

##### `DSF_OWNED_TAG`<sup>Required</sup> <a name="DSF_OWNED_TAG" id="aws-dsf.processing.PySparkApplicationPackage.property.DSF_OWNED_TAG"></a>

```typescript
public readonly DSF_OWNED_TAG: string;
```

- *Type:* string

---

##### `DSF_TRACKING_CODE`<sup>Required</sup> <a name="DSF_TRACKING_CODE" id="aws-dsf.processing.PySparkApplicationPackage.property.DSF_TRACKING_CODE"></a>

```typescript
public readonly DSF_TRACKING_CODE: string;
```

- *Type:* string

---

### S3DataCopy <a name="S3DataCopy" id="aws-dsf.utils.S3DataCopy"></a>

Copy data from one S3 bucket to another.

> [https://awslabs.github.io/aws-data-solutions-framework/docs/constructs/library/s3-data-copy](https://awslabs.github.io/aws-data-solutions-framework/docs/constructs/library/s3-data-copy)

#### Initializers <a name="Initializers" id="aws-dsf.utils.S3DataCopy.Initializer"></a>

```typescript
import { utils } from 'aws-dsf'

new utils.S3DataCopy(scope: Construct, id: string, props: S3DataCopyProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.utils.S3DataCopy.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | *No description.* |
| <code><a href="#aws-dsf.utils.S3DataCopy.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#aws-dsf.utils.S3DataCopy.Initializer.parameter.props">props</a></code> | <code>aws-dsf.utils.S3DataCopyProps</code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="aws-dsf.utils.S3DataCopy.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="aws-dsf.utils.S3DataCopy.Initializer.parameter.id"></a>

- *Type:* string

---

##### `props`<sup>Required</sup> <a name="props" id="aws-dsf.utils.S3DataCopy.Initializer.parameter.props"></a>

- *Type:* aws-dsf.utils.S3DataCopyProps

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-dsf.utils.S3DataCopy.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#aws-dsf.utils.S3DataCopy.retrieveVersion">retrieveVersion</a></code> | Retrieve DSF package.json version. |

---

##### `toString` <a name="toString" id="aws-dsf.utils.S3DataCopy.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `retrieveVersion` <a name="retrieveVersion" id="aws-dsf.utils.S3DataCopy.retrieveVersion"></a>

```typescript
public retrieveVersion(): any
```

Retrieve DSF package.json version.

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-dsf.utils.S3DataCopy.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |

---

##### `isConstruct` <a name="isConstruct" id="aws-dsf.utils.S3DataCopy.isConstruct"></a>

```typescript
import { utils } from 'aws-dsf'

utils.S3DataCopy.isConstruct(x: any)
```

Checks if `x` is a construct.

Use this method instead of `instanceof` to properly detect `Construct`
instances, even when the construct library is symlinked.

Explanation: in JavaScript, multiple copies of the `constructs` library on
disk are seen as independent, completely different libraries. As a
consequence, the class `Construct` in each copy of the `constructs` library
is seen as a different class, and an instance of one class will not test as
`instanceof` the other class. `npm install` will not create installations
like this, but users may manually symlink construct libraries together or
use a monorepo tool: in those cases, multiple copies of the `constructs`
library can be accidentally installed, and `instanceof` will behave
unpredictably. It is safest to avoid using `instanceof`, and using
this type-testing method instead.

###### `x`<sup>Required</sup> <a name="x" id="aws-dsf.utils.S3DataCopy.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.utils.S3DataCopy.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#aws-dsf.utils.S3DataCopy.property.copyFunction">copyFunction</a></code> | <code>aws-cdk-lib.aws_lambda.IFunction</code> | The Lambda Function for the copy. |
| <code><a href="#aws-dsf.utils.S3DataCopy.property.copyLogGroup">copyLogGroup</a></code> | <code>aws-cdk-lib.aws_logs.ILogGroup</code> | The CloudWatch Log Group for the S3 data copy. |
| <code><a href="#aws-dsf.utils.S3DataCopy.property.copyRole">copyRole</a></code> | <code>aws-cdk-lib.aws_iam.IRole</code> | The IAM Role for the copy Lambba Function. |
| <code><a href="#aws-dsf.utils.S3DataCopy.property.cleanUpFunction">cleanUpFunction</a></code> | <code>aws-cdk-lib.aws_lambda.IFunction</code> | The Lambda function for the S3 data copy cleaning up lambda. |
| <code><a href="#aws-dsf.utils.S3DataCopy.property.cleanUpLogGroup">cleanUpLogGroup</a></code> | <code>aws-cdk-lib.aws_logs.ILogGroup</code> | The CloudWatch Log Group for the S3 data copy cleaning up lambda. |
| <code><a href="#aws-dsf.utils.S3DataCopy.property.cleanUpRole">cleanUpRole</a></code> | <code>aws-cdk-lib.aws_iam.IRole</code> | The IAM Role for the the S3 data copy cleaning up lambda. |
| <code><a href="#aws-dsf.utils.S3DataCopy.property.securityGroups">securityGroups</a></code> | <code>aws-cdk-lib.aws_ec2.ISecurityGroup[]</code> | The list of EC2 Security Groups used by the Lambda Functions. |

---

##### `node`<sup>Required</sup> <a name="node" id="aws-dsf.utils.S3DataCopy.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `copyFunction`<sup>Required</sup> <a name="copyFunction" id="aws-dsf.utils.S3DataCopy.property.copyFunction"></a>

```typescript
public readonly copyFunction: IFunction;
```

- *Type:* aws-cdk-lib.aws_lambda.IFunction

The Lambda Function for the copy.

---

##### `copyLogGroup`<sup>Required</sup> <a name="copyLogGroup" id="aws-dsf.utils.S3DataCopy.property.copyLogGroup"></a>

```typescript
public readonly copyLogGroup: ILogGroup;
```

- *Type:* aws-cdk-lib.aws_logs.ILogGroup

The CloudWatch Log Group for the S3 data copy.

---

##### `copyRole`<sup>Required</sup> <a name="copyRole" id="aws-dsf.utils.S3DataCopy.property.copyRole"></a>

```typescript
public readonly copyRole: IRole;
```

- *Type:* aws-cdk-lib.aws_iam.IRole

The IAM Role for the copy Lambba Function.

---

##### `cleanUpFunction`<sup>Optional</sup> <a name="cleanUpFunction" id="aws-dsf.utils.S3DataCopy.property.cleanUpFunction"></a>

```typescript
public readonly cleanUpFunction: IFunction;
```

- *Type:* aws-cdk-lib.aws_lambda.IFunction

The Lambda function for the S3 data copy cleaning up lambda.

---

##### `cleanUpLogGroup`<sup>Optional</sup> <a name="cleanUpLogGroup" id="aws-dsf.utils.S3DataCopy.property.cleanUpLogGroup"></a>

```typescript
public readonly cleanUpLogGroup: ILogGroup;
```

- *Type:* aws-cdk-lib.aws_logs.ILogGroup

The CloudWatch Log Group for the S3 data copy cleaning up lambda.

---

##### `cleanUpRole`<sup>Optional</sup> <a name="cleanUpRole" id="aws-dsf.utils.S3DataCopy.property.cleanUpRole"></a>

```typescript
public readonly cleanUpRole: IRole;
```

- *Type:* aws-cdk-lib.aws_iam.IRole

The IAM Role for the the S3 data copy cleaning up lambda.

---

##### `securityGroups`<sup>Optional</sup> <a name="securityGroups" id="aws-dsf.utils.S3DataCopy.property.securityGroups"></a>

```typescript
public readonly securityGroups: ISecurityGroup[];
```

- *Type:* aws-cdk-lib.aws_ec2.ISecurityGroup[]

The list of EC2 Security Groups used by the Lambda Functions.

---

#### Constants <a name="Constants" id="Constants"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.utils.S3DataCopy.property.DSF_OWNED_TAG">DSF_OWNED_TAG</a></code> | <code>string</code> | *No description.* |
| <code><a href="#aws-dsf.utils.S3DataCopy.property.DSF_TRACKING_CODE">DSF_TRACKING_CODE</a></code> | <code>string</code> | *No description.* |

---

##### `DSF_OWNED_TAG`<sup>Required</sup> <a name="DSF_OWNED_TAG" id="aws-dsf.utils.S3DataCopy.property.DSF_OWNED_TAG"></a>

```typescript
public readonly DSF_OWNED_TAG: string;
```

- *Type:* string

---

##### `DSF_TRACKING_CODE`<sup>Required</sup> <a name="DSF_TRACKING_CODE" id="aws-dsf.utils.S3DataCopy.property.DSF_TRACKING_CODE"></a>

```typescript
public readonly DSF_TRACKING_CODE: string;
```

- *Type:* string

---

### SparkEmrCICDPipeline <a name="SparkEmrCICDPipeline" id="aws-dsf.processing.SparkEmrCICDPipeline"></a>

A CICD Pipeline that tests and deploys a Spark application in cross-account environments using CDK Pipelines.

> [https://awslabs.github.io/data-solutions-framework-on-aws/docs/constructs/library/spark-cicd-pipeline](https://awslabs.github.io/data-solutions-framework-on-aws/docs/constructs/library/spark-cicd-pipeline)

*Example*

```typescript
import { Bucket } from 'aws-cdk-lib/aws-s3';

interface MyApplicationStackProps extends cdk.StackProps {
  readonly stage: dsf.utils.CICDStage;
}

class MyApplicationStack extends cdk.Stack {
  constructor(scope: cdk.Stack, props?: MyApplicationStackProps) {
    super(scope, 'MyApplicationStack');
    const bucket = new Bucket(this, 'TestBucket', {
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    new cdk.CfnOutput(this, 'BucketName', { value: bucket.bucketName });
  }
}

class MyStackFactory implements dsf.utils.ApplicationStackFactory {
  createStack(scope: cdk.Stack, stage: dsf.utils.CICDStage): cdk.Stack {
    return new MyApplicationStack(scope, { stage });
  }
}

class MyCICDStack extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    new dsf.processing.SparkEmrCICDPipeline(this, 'TestConstruct', {
       sparkApplicationName: 'test',
       applicationStackFactory: new MyStackFactory(),
       cdkApplicationPath: 'cdk/',
       sparkApplicationPath: 'spark/',
       sparkImage: dsf.processing.SparkImage.EMR_6_12,
       integTestScript: 'cdk/integ-test.sh',
       integTestEnv: {
         TEST_BUCKET: 'BucketName',
       },
    });
  }
}
```


#### Initializers <a name="Initializers" id="aws-dsf.processing.SparkEmrCICDPipeline.Initializer"></a>

```typescript
import { processing } from 'aws-dsf'

new processing.SparkEmrCICDPipeline(scope: Construct, id: string, props: SparkEmrCICDPipelineProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.processing.SparkEmrCICDPipeline.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | the Scope of the CDK Construct. |
| <code><a href="#aws-dsf.processing.SparkEmrCICDPipeline.Initializer.parameter.id">id</a></code> | <code>string</code> | the ID of the CDK Construct. |
| <code><a href="#aws-dsf.processing.SparkEmrCICDPipeline.Initializer.parameter.props">props</a></code> | <code>aws-dsf.processing.SparkEmrCICDPipelineProps</code> | the SparkCICDPipelineProps properties. |

---

##### `scope`<sup>Required</sup> <a name="scope" id="aws-dsf.processing.SparkEmrCICDPipeline.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

the Scope of the CDK Construct.

---

##### `id`<sup>Required</sup> <a name="id" id="aws-dsf.processing.SparkEmrCICDPipeline.Initializer.parameter.id"></a>

- *Type:* string

the ID of the CDK Construct.

---

##### `props`<sup>Required</sup> <a name="props" id="aws-dsf.processing.SparkEmrCICDPipeline.Initializer.parameter.props"></a>

- *Type:* aws-dsf.processing.SparkEmrCICDPipelineProps

the SparkCICDPipelineProps properties.

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-dsf.processing.SparkEmrCICDPipeline.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#aws-dsf.processing.SparkEmrCICDPipeline.retrieveVersion">retrieveVersion</a></code> | Retrieve DSF package.json version. |

---

##### `toString` <a name="toString" id="aws-dsf.processing.SparkEmrCICDPipeline.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `retrieveVersion` <a name="retrieveVersion" id="aws-dsf.processing.SparkEmrCICDPipeline.retrieveVersion"></a>

```typescript
public retrieveVersion(): any
```

Retrieve DSF package.json version.

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-dsf.processing.SparkEmrCICDPipeline.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |

---

##### `isConstruct` <a name="isConstruct" id="aws-dsf.processing.SparkEmrCICDPipeline.isConstruct"></a>

```typescript
import { processing } from 'aws-dsf'

processing.SparkEmrCICDPipeline.isConstruct(x: any)
```

Checks if `x` is a construct.

Use this method instead of `instanceof` to properly detect `Construct`
instances, even when the construct library is symlinked.

Explanation: in JavaScript, multiple copies of the `constructs` library on
disk are seen as independent, completely different libraries. As a
consequence, the class `Construct` in each copy of the `constructs` library
is seen as a different class, and an instance of one class will not test as
`instanceof` the other class. `npm install` will not create installations
like this, but users may manually symlink construct libraries together or
use a monorepo tool: in those cases, multiple copies of the `constructs`
library can be accidentally installed, and `instanceof` will behave
unpredictably. It is safest to avoid using `instanceof`, and using
this type-testing method instead.

###### `x`<sup>Required</sup> <a name="x" id="aws-dsf.processing.SparkEmrCICDPipeline.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.processing.SparkEmrCICDPipeline.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#aws-dsf.processing.SparkEmrCICDPipeline.property.artifactAccessLogsBucket">artifactAccessLogsBucket</a></code> | <code>aws-cdk-lib.aws_s3.IBucket</code> | The S3 bucket for storing access logs on the artifact bucket. |
| <code><a href="#aws-dsf.processing.SparkEmrCICDPipeline.property.artifactBucket">artifactBucket</a></code> | <code>aws-cdk-lib.aws_s3.IBucket</code> | The S3 bucket for storing the artifacts. |
| <code><a href="#aws-dsf.processing.SparkEmrCICDPipeline.property.pipeline">pipeline</a></code> | <code>aws-cdk-lib.pipelines.CodePipeline</code> | The CodePipeline created as part of the Spark CICD Pipeline. |
| <code><a href="#aws-dsf.processing.SparkEmrCICDPipeline.property.pipelineLogGroup">pipelineLogGroup</a></code> | <code>aws-cdk-lib.aws_logs.ILogGroup</code> | The CloudWatch Log Group for storing the CodePipeline logs. |
| <code><a href="#aws-dsf.processing.SparkEmrCICDPipeline.property.repository">repository</a></code> | <code>aws-cdk-lib.aws_codecommit.Repository</code> | The CodeCommit repository created as part of the Spark CICD Pipeline. |
| <code><a href="#aws-dsf.processing.SparkEmrCICDPipeline.property.integrationTestStage">integrationTestStage</a></code> | <code>aws-cdk-lib.pipelines.CodeBuildStep</code> | The CodeBuild Step for the staging stage. |

---

##### `node`<sup>Required</sup> <a name="node" id="aws-dsf.processing.SparkEmrCICDPipeline.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `artifactAccessLogsBucket`<sup>Required</sup> <a name="artifactAccessLogsBucket" id="aws-dsf.processing.SparkEmrCICDPipeline.property.artifactAccessLogsBucket"></a>

```typescript
public readonly artifactAccessLogsBucket: IBucket;
```

- *Type:* aws-cdk-lib.aws_s3.IBucket

The S3 bucket for storing access logs on the artifact bucket.

---

##### `artifactBucket`<sup>Required</sup> <a name="artifactBucket" id="aws-dsf.processing.SparkEmrCICDPipeline.property.artifactBucket"></a>

```typescript
public readonly artifactBucket: IBucket;
```

- *Type:* aws-cdk-lib.aws_s3.IBucket

The S3 bucket for storing the artifacts.

---

##### `pipeline`<sup>Required</sup> <a name="pipeline" id="aws-dsf.processing.SparkEmrCICDPipeline.property.pipeline"></a>

```typescript
public readonly pipeline: CodePipeline;
```

- *Type:* aws-cdk-lib.pipelines.CodePipeline

The CodePipeline created as part of the Spark CICD Pipeline.

---

##### `pipelineLogGroup`<sup>Required</sup> <a name="pipelineLogGroup" id="aws-dsf.processing.SparkEmrCICDPipeline.property.pipelineLogGroup"></a>

```typescript
public readonly pipelineLogGroup: ILogGroup;
```

- *Type:* aws-cdk-lib.aws_logs.ILogGroup

The CloudWatch Log Group for storing the CodePipeline logs.

---

##### `repository`<sup>Required</sup> <a name="repository" id="aws-dsf.processing.SparkEmrCICDPipeline.property.repository"></a>

```typescript
public readonly repository: Repository;
```

- *Type:* aws-cdk-lib.aws_codecommit.Repository

The CodeCommit repository created as part of the Spark CICD Pipeline.

---

##### `integrationTestStage`<sup>Optional</sup> <a name="integrationTestStage" id="aws-dsf.processing.SparkEmrCICDPipeline.property.integrationTestStage"></a>

```typescript
public readonly integrationTestStage: CodeBuildStep;
```

- *Type:* aws-cdk-lib.pipelines.CodeBuildStep

The CodeBuild Step for the staging stage.

---

#### Constants <a name="Constants" id="Constants"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.processing.SparkEmrCICDPipeline.property.DSF_OWNED_TAG">DSF_OWNED_TAG</a></code> | <code>string</code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkEmrCICDPipeline.property.DSF_TRACKING_CODE">DSF_TRACKING_CODE</a></code> | <code>string</code> | *No description.* |

---

##### `DSF_OWNED_TAG`<sup>Required</sup> <a name="DSF_OWNED_TAG" id="aws-dsf.processing.SparkEmrCICDPipeline.property.DSF_OWNED_TAG"></a>

```typescript
public readonly DSF_OWNED_TAG: string;
```

- *Type:* string

---

##### `DSF_TRACKING_CODE`<sup>Required</sup> <a name="DSF_TRACKING_CODE" id="aws-dsf.processing.SparkEmrCICDPipeline.property.DSF_TRACKING_CODE"></a>

```typescript
public readonly DSF_TRACKING_CODE: string;
```

- *Type:* string

---

### SparkEmrContainersRuntime <a name="SparkEmrContainersRuntime" id="aws-dsf.processing.SparkEmrContainersRuntime"></a>

A construct to create an EKS cluster, configure it and enable it with EMR on EKS.

> [https://awslabs.github.io/aws-data-solutions-framework/docs/constructs/library/spark-emr-containers-runtime](https://awslabs.github.io/aws-data-solutions-framework/docs/constructs/library/spark-emr-containers-runtime)

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntime.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntime.addEmrVirtualCluster">addEmrVirtualCluster</a></code> | Add a new Amazon EMR Virtual Cluster linked to Amazon EKS Cluster. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntime.addKarpenterNodePoolAndNodeClass">addKarpenterNodePoolAndNodeClass</a></code> | Apply the provided manifest and add the CDK dependency on EKS cluster. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntime.createExecutionRole">createExecutionRole</a></code> | Create and configure a new Amazon IAM Role usable as an execution role. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntime.retrieveVersion">retrieveVersion</a></code> | Retrieve DSF package.json version. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntime.uploadPodTemplate">uploadPodTemplate</a></code> | Upload podTemplates to the Amazon S3 location used by the cluster. |

---

##### `toString` <a name="toString" id="aws-dsf.processing.SparkEmrContainersRuntime.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `addEmrVirtualCluster` <a name="addEmrVirtualCluster" id="aws-dsf.processing.SparkEmrContainersRuntime.addEmrVirtualCluster"></a>

```typescript
public addEmrVirtualCluster(scope: Construct, options: EmrVirtualClusterProps): CfnVirtualCluster
```

Add a new Amazon EMR Virtual Cluster linked to Amazon EKS Cluster.

###### `scope`<sup>Required</sup> <a name="scope" id="aws-dsf.processing.SparkEmrContainersRuntime.addEmrVirtualCluster.parameter.scope"></a>

- *Type:* constructs.Construct

of the stack where virtual cluster is deployed.

---

###### `options`<sup>Required</sup> <a name="options" id="aws-dsf.processing.SparkEmrContainersRuntime.addEmrVirtualCluster.parameter.options"></a>

- *Type:* aws-dsf.processing.EmrVirtualClusterProps

the EmrVirtualClusterProps [properties]{@link EmrVirtualClusterProps}.

---

##### `addKarpenterNodePoolAndNodeClass` <a name="addKarpenterNodePoolAndNodeClass" id="aws-dsf.processing.SparkEmrContainersRuntime.addKarpenterNodePoolAndNodeClass"></a>

```typescript
public addKarpenterNodePoolAndNodeClass(id: string, manifest: any): any
```

Apply the provided manifest and add the CDK dependency on EKS cluster.

###### `id`<sup>Required</sup> <a name="id" id="aws-dsf.processing.SparkEmrContainersRuntime.addKarpenterNodePoolAndNodeClass.parameter.id"></a>

- *Type:* string

the unique ID of the CDK resource.

---

###### `manifest`<sup>Required</sup> <a name="manifest" id="aws-dsf.processing.SparkEmrContainersRuntime.addKarpenterNodePoolAndNodeClass.parameter.manifest"></a>

- *Type:* any

The manifest to apply.

You can use the Utils class that offers method to read yaml file and load it as a manifest

---

##### `createExecutionRole` <a name="createExecutionRole" id="aws-dsf.processing.SparkEmrContainersRuntime.createExecutionRole"></a>

```typescript
public createExecutionRole(scope: Construct, id: string, policy: IManagedPolicy, eksNamespace: string, name: string): Role
```

Create and configure a new Amazon IAM Role usable as an execution role.

This method makes the created role assumed by the Amazon EKS cluster Open ID Connect provider.

###### `scope`<sup>Required</sup> <a name="scope" id="aws-dsf.processing.SparkEmrContainersRuntime.createExecutionRole.parameter.scope"></a>

- *Type:* constructs.Construct

of the IAM role.

---

###### `id`<sup>Required</sup> <a name="id" id="aws-dsf.processing.SparkEmrContainersRuntime.createExecutionRole.parameter.id"></a>

- *Type:* string

of the CDK resource to be created, it should be unique across the stack.

---

###### `policy`<sup>Required</sup> <a name="policy" id="aws-dsf.processing.SparkEmrContainersRuntime.createExecutionRole.parameter.policy"></a>

- *Type:* aws-cdk-lib.aws_iam.IManagedPolicy

the execution policy to attach to the role.

---

###### `eksNamespace`<sup>Required</sup> <a name="eksNamespace" id="aws-dsf.processing.SparkEmrContainersRuntime.createExecutionRole.parameter.eksNamespace"></a>

- *Type:* string

The namespace from which the role is going to be used.

MUST be the same as the namespace of the Virtual Cluster from which the job is submitted

---

###### `name`<sup>Required</sup> <a name="name" id="aws-dsf.processing.SparkEmrContainersRuntime.createExecutionRole.parameter.name"></a>

- *Type:* string

Name to use for the role, required and is used to scope the iam role.

---

##### `retrieveVersion` <a name="retrieveVersion" id="aws-dsf.processing.SparkEmrContainersRuntime.retrieveVersion"></a>

```typescript
public retrieveVersion(): any
```

Retrieve DSF package.json version.

##### `uploadPodTemplate` <a name="uploadPodTemplate" id="aws-dsf.processing.SparkEmrContainersRuntime.uploadPodTemplate"></a>

```typescript
public uploadPodTemplate(id: string, filePath: string): void
```

Upload podTemplates to the Amazon S3 location used by the cluster.

###### `id`<sup>Required</sup> <a name="id" id="aws-dsf.processing.SparkEmrContainersRuntime.uploadPodTemplate.parameter.id"></a>

- *Type:* string

the unique ID of the CDK resource.

---

###### `filePath`<sup>Required</sup> <a name="filePath" id="aws-dsf.processing.SparkEmrContainersRuntime.uploadPodTemplate.parameter.filePath"></a>

- *Type:* string

The local path of the yaml podTemplate files to upload.

---

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntime.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntime.getOrCreate">getOrCreate</a></code> | Get an existing EmrEksCluster based on the cluster name property or create a new one only one EKS cluster can exist per stack. |

---

##### `isConstruct` <a name="isConstruct" id="aws-dsf.processing.SparkEmrContainersRuntime.isConstruct"></a>

```typescript
import { processing } from 'aws-dsf'

processing.SparkEmrContainersRuntime.isConstruct(x: any)
```

Checks if `x` is a construct.

Use this method instead of `instanceof` to properly detect `Construct`
instances, even when the construct library is symlinked.

Explanation: in JavaScript, multiple copies of the `constructs` library on
disk are seen as independent, completely different libraries. As a
consequence, the class `Construct` in each copy of the `constructs` library
is seen as a different class, and an instance of one class will not test as
`instanceof` the other class. `npm install` will not create installations
like this, but users may manually symlink construct libraries together or
use a monorepo tool: in those cases, multiple copies of the `constructs`
library can be accidentally installed, and `instanceof` will behave
unpredictably. It is safest to avoid using `instanceof`, and using
this type-testing method instead.

###### `x`<sup>Required</sup> <a name="x" id="aws-dsf.processing.SparkEmrContainersRuntime.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

##### `getOrCreate` <a name="getOrCreate" id="aws-dsf.processing.SparkEmrContainersRuntime.getOrCreate"></a>

```typescript
import { processing } from 'aws-dsf'

processing.SparkEmrContainersRuntime.getOrCreate(scope: Construct, props: SparkEmrContainersRuntimeProps)
```

Get an existing EmrEksCluster based on the cluster name property or create a new one only one EKS cluster can exist per stack.

###### `scope`<sup>Required</sup> <a name="scope" id="aws-dsf.processing.SparkEmrContainersRuntime.getOrCreate.parameter.scope"></a>

- *Type:* constructs.Construct

the CDK scope used to search or create the cluster.

---

###### `props`<sup>Required</sup> <a name="props" id="aws-dsf.processing.SparkEmrContainersRuntime.getOrCreate.parameter.props"></a>

- *Type:* aws-dsf.processing.SparkEmrContainersRuntimeProps

the EmrEksClusterProps [properties]{@link EmrEksClusterProps } if created.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntime.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntime.property.ec2InstanceNodeGroupRole">ec2InstanceNodeGroupRole</a></code> | <code>aws-cdk-lib.aws_iam.IRole</code> | The IAM role used by the tooling managed nodegroup hosting core Kubernetes controllers like EBS CSI driver, core dns. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntime.property.eksCluster">eksCluster</a></code> | <code>aws-cdk-lib.aws_eks.Cluster</code> | The EKS cluster created by the construct if it is not provided. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntime.property.vpc">vpc</a></code> | <code>aws-cdk-lib.aws_ec2.IVpc</code> | The VPC used by the EKS cluster. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntime.property.assetBucket">assetBucket</a></code> | <code>aws-cdk-lib.aws_s3.IBucket</code> | The bucket holding podtemplates referenced in the configuration override for the job. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntime.property.assetUploadBucketRole">assetUploadBucketRole</a></code> | <code>aws-cdk-lib.aws_iam.IRole</code> | The IAM role used to upload assets (pod templates) on S3. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntime.property.awsNodeRole">awsNodeRole</a></code> | <code>aws-cdk-lib.aws_iam.IRole</code> | The IAM Role used by IRSA for the aws-node daemonset. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntime.property.criticalDefaultConfig">criticalDefaultConfig</a></code> | <code>string</code> | The configuration override for the spark application to use with the default nodes for criticale jobs. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntime.property.csiDriverIrsaRole">csiDriverIrsaRole</a></code> | <code>aws-cdk-lib.aws_iam.IRole</code> | The IAM Role created for the EBS CSI controller. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntime.property.eksSecretKmsKey">eksSecretKmsKey</a></code> | <code>aws-cdk-lib.aws_kms.IKey</code> | The KMS key used for storing EKS secrets. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntime.property.emrServiceRole">emrServiceRole</a></code> | <code>aws-cdk-lib.aws_iam.CfnServiceLinkedRole</code> | The Service Linked role created for EMR. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntime.property.flowLogGroup">flowLogGroup</a></code> | <code>aws-cdk-lib.aws_logs.ILogGroup</code> | The CloudWatch Log Group for the VPC flow log when the VPC is created. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntime.property.flowLogKey">flowLogKey</a></code> | <code>aws-cdk-lib.aws_kms.IKey</code> | The KMS Key used for the VPC flow logs when the VPC is created. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntime.property.flowLogRole">flowLogRole</a></code> | <code>aws-cdk-lib.aws_iam.IRole</code> | The IAM Role used for the VPC flow logs when the VPC is created. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntime.property.karpenterEventRules">karpenterEventRules</a></code> | <code>aws-cdk-lib.aws_events.IRule[]</code> | The rules used by Karpenter to track node health, rules are defined in the cloudformation below https://raw.githubusercontent.com/aws/karpenter/"${KARPENTER_VERSION}"/website/content/en/preview/getting-started/getting-started-with-karpenter/cloudformation.yaml. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntime.property.karpenterIrsaRole">karpenterIrsaRole</a></code> | <code>aws-cdk-lib.aws_iam.IRole</code> | The IAM role created for the Karpenter controller. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntime.property.karpenterQueue">karpenterQueue</a></code> | <code>aws-cdk-lib.aws_sqs.IQueue</code> | The SQS queue used by Karpenter to receive critical events from AWS services which may affect your nodes. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntime.property.karpenterSecurityGroup">karpenterSecurityGroup</a></code> | <code>aws-cdk-lib.aws_ec2.ISecurityGroup</code> | The security group used by the EC2NodeClass of the default nodes. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntime.property.notebookDefaultConfig">notebookDefaultConfig</a></code> | <code>string</code> | The configuration override for the spark application to use with the default nodes dedicated for notebooks. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntime.property.podTemplateS3LocationCriticalDriver">podTemplateS3LocationCriticalDriver</a></code> | <code>string</code> | The S3 location holding the driver pod tempalte for critical nodes. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntime.property.podTemplateS3LocationCriticalExecutor">podTemplateS3LocationCriticalExecutor</a></code> | <code>string</code> | The S3 location holding the executor pod tempalte for critical nodes. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntime.property.podTemplateS3LocationDriverShared">podTemplateS3LocationDriverShared</a></code> | <code>string</code> | The S3 location holding the driver pod tempalte for shared nodes. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntime.property.podTemplateS3LocationExecutorShared">podTemplateS3LocationExecutorShared</a></code> | <code>string</code> | The S3 location holding the executor pod tempalte for shared nodes. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntime.property.podTemplateS3LocationNotebookDriver">podTemplateS3LocationNotebookDriver</a></code> | <code>string</code> | The S3 location holding the driver pod tempalte for interactive sessions. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntime.property.podTemplateS3LocationNotebookExecutor">podTemplateS3LocationNotebookExecutor</a></code> | <code>string</code> | The S3 location holding the executor pod tempalte for interactive sessions. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntime.property.s3VpcEndpoint">s3VpcEndpoint</a></code> | <code>aws-cdk-lib.aws_ec2.IGatewayVpcEndpoint</code> | The S3 VPC endpoint attached to the private subnets of the VPC when VPC is created. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntime.property.sharedDefaultConfig">sharedDefaultConfig</a></code> | <code>string</code> | The configuration override for the spark application to use with the default nodes for none criticale jobs. |

---

##### `node`<sup>Required</sup> <a name="node" id="aws-dsf.processing.SparkEmrContainersRuntime.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `ec2InstanceNodeGroupRole`<sup>Required</sup> <a name="ec2InstanceNodeGroupRole" id="aws-dsf.processing.SparkEmrContainersRuntime.property.ec2InstanceNodeGroupRole"></a>

```typescript
public readonly ec2InstanceNodeGroupRole: IRole;
```

- *Type:* aws-cdk-lib.aws_iam.IRole

The IAM role used by the tooling managed nodegroup hosting core Kubernetes controllers like EBS CSI driver, core dns.

---

##### `eksCluster`<sup>Required</sup> <a name="eksCluster" id="aws-dsf.processing.SparkEmrContainersRuntime.property.eksCluster"></a>

```typescript
public readonly eksCluster: Cluster;
```

- *Type:* aws-cdk-lib.aws_eks.Cluster

The EKS cluster created by the construct if it is not provided.

---

##### `vpc`<sup>Required</sup> <a name="vpc" id="aws-dsf.processing.SparkEmrContainersRuntime.property.vpc"></a>

```typescript
public readonly vpc: IVpc;
```

- *Type:* aws-cdk-lib.aws_ec2.IVpc

The VPC used by the EKS cluster.

---

##### `assetBucket`<sup>Optional</sup> <a name="assetBucket" id="aws-dsf.processing.SparkEmrContainersRuntime.property.assetBucket"></a>

```typescript
public readonly assetBucket: IBucket;
```

- *Type:* aws-cdk-lib.aws_s3.IBucket

The bucket holding podtemplates referenced in the configuration override for the job.

---

##### `assetUploadBucketRole`<sup>Optional</sup> <a name="assetUploadBucketRole" id="aws-dsf.processing.SparkEmrContainersRuntime.property.assetUploadBucketRole"></a>

```typescript
public readonly assetUploadBucketRole: IRole;
```

- *Type:* aws-cdk-lib.aws_iam.IRole

The IAM role used to upload assets (pod templates) on S3.

---

##### `awsNodeRole`<sup>Optional</sup> <a name="awsNodeRole" id="aws-dsf.processing.SparkEmrContainersRuntime.property.awsNodeRole"></a>

```typescript
public readonly awsNodeRole: IRole;
```

- *Type:* aws-cdk-lib.aws_iam.IRole

The IAM Role used by IRSA for the aws-node daemonset.

---

##### `criticalDefaultConfig`<sup>Optional</sup> <a name="criticalDefaultConfig" id="aws-dsf.processing.SparkEmrContainersRuntime.property.criticalDefaultConfig"></a>

```typescript
public readonly criticalDefaultConfig: string;
```

- *Type:* string

The configuration override for the spark application to use with the default nodes for criticale jobs.

---

##### `csiDriverIrsaRole`<sup>Optional</sup> <a name="csiDriverIrsaRole" id="aws-dsf.processing.SparkEmrContainersRuntime.property.csiDriverIrsaRole"></a>

```typescript
public readonly csiDriverIrsaRole: IRole;
```

- *Type:* aws-cdk-lib.aws_iam.IRole

The IAM Role created for the EBS CSI controller.

---

##### `eksSecretKmsKey`<sup>Optional</sup> <a name="eksSecretKmsKey" id="aws-dsf.processing.SparkEmrContainersRuntime.property.eksSecretKmsKey"></a>

```typescript
public readonly eksSecretKmsKey: IKey;
```

- *Type:* aws-cdk-lib.aws_kms.IKey

The KMS key used for storing EKS secrets.

---

##### `emrServiceRole`<sup>Optional</sup> <a name="emrServiceRole" id="aws-dsf.processing.SparkEmrContainersRuntime.property.emrServiceRole"></a>

```typescript
public readonly emrServiceRole: CfnServiceLinkedRole;
```

- *Type:* aws-cdk-lib.aws_iam.CfnServiceLinkedRole

The Service Linked role created for EMR.

---

##### `flowLogGroup`<sup>Optional</sup> <a name="flowLogGroup" id="aws-dsf.processing.SparkEmrContainersRuntime.property.flowLogGroup"></a>

```typescript
public readonly flowLogGroup: ILogGroup;
```

- *Type:* aws-cdk-lib.aws_logs.ILogGroup

The CloudWatch Log Group for the VPC flow log when the VPC is created.

---

##### `flowLogKey`<sup>Optional</sup> <a name="flowLogKey" id="aws-dsf.processing.SparkEmrContainersRuntime.property.flowLogKey"></a>

```typescript
public readonly flowLogKey: IKey;
```

- *Type:* aws-cdk-lib.aws_kms.IKey

The KMS Key used for the VPC flow logs when the VPC is created.

---

##### `flowLogRole`<sup>Optional</sup> <a name="flowLogRole" id="aws-dsf.processing.SparkEmrContainersRuntime.property.flowLogRole"></a>

```typescript
public readonly flowLogRole: IRole;
```

- *Type:* aws-cdk-lib.aws_iam.IRole

The IAM Role used for the VPC flow logs when the VPC is created.

---

##### `karpenterEventRules`<sup>Optional</sup> <a name="karpenterEventRules" id="aws-dsf.processing.SparkEmrContainersRuntime.property.karpenterEventRules"></a>

```typescript
public readonly karpenterEventRules: IRule[];
```

- *Type:* aws-cdk-lib.aws_events.IRule[]

The rules used by Karpenter to track node health, rules are defined in the cloudformation below https://raw.githubusercontent.com/aws/karpenter/"${KARPENTER_VERSION}"/website/content/en/preview/getting-started/getting-started-with-karpenter/cloudformation.yaml.

---

##### `karpenterIrsaRole`<sup>Optional</sup> <a name="karpenterIrsaRole" id="aws-dsf.processing.SparkEmrContainersRuntime.property.karpenterIrsaRole"></a>

```typescript
public readonly karpenterIrsaRole: IRole;
```

- *Type:* aws-cdk-lib.aws_iam.IRole

The IAM role created for the Karpenter controller.

---

##### `karpenterQueue`<sup>Optional</sup> <a name="karpenterQueue" id="aws-dsf.processing.SparkEmrContainersRuntime.property.karpenterQueue"></a>

```typescript
public readonly karpenterQueue: IQueue;
```

- *Type:* aws-cdk-lib.aws_sqs.IQueue

The SQS queue used by Karpenter to receive critical events from AWS services which may affect your nodes.

---

##### `karpenterSecurityGroup`<sup>Optional</sup> <a name="karpenterSecurityGroup" id="aws-dsf.processing.SparkEmrContainersRuntime.property.karpenterSecurityGroup"></a>

```typescript
public readonly karpenterSecurityGroup: ISecurityGroup;
```

- *Type:* aws-cdk-lib.aws_ec2.ISecurityGroup

The security group used by the EC2NodeClass of the default nodes.

---

##### `notebookDefaultConfig`<sup>Optional</sup> <a name="notebookDefaultConfig" id="aws-dsf.processing.SparkEmrContainersRuntime.property.notebookDefaultConfig"></a>

```typescript
public readonly notebookDefaultConfig: string;
```

- *Type:* string

The configuration override for the spark application to use with the default nodes dedicated for notebooks.

---

##### `podTemplateS3LocationCriticalDriver`<sup>Optional</sup> <a name="podTemplateS3LocationCriticalDriver" id="aws-dsf.processing.SparkEmrContainersRuntime.property.podTemplateS3LocationCriticalDriver"></a>

```typescript
public readonly podTemplateS3LocationCriticalDriver: string;
```

- *Type:* string

The S3 location holding the driver pod tempalte for critical nodes.

---

##### `podTemplateS3LocationCriticalExecutor`<sup>Optional</sup> <a name="podTemplateS3LocationCriticalExecutor" id="aws-dsf.processing.SparkEmrContainersRuntime.property.podTemplateS3LocationCriticalExecutor"></a>

```typescript
public readonly podTemplateS3LocationCriticalExecutor: string;
```

- *Type:* string

The S3 location holding the executor pod tempalte for critical nodes.

---

##### `podTemplateS3LocationDriverShared`<sup>Optional</sup> <a name="podTemplateS3LocationDriverShared" id="aws-dsf.processing.SparkEmrContainersRuntime.property.podTemplateS3LocationDriverShared"></a>

```typescript
public readonly podTemplateS3LocationDriverShared: string;
```

- *Type:* string

The S3 location holding the driver pod tempalte for shared nodes.

---

##### `podTemplateS3LocationExecutorShared`<sup>Optional</sup> <a name="podTemplateS3LocationExecutorShared" id="aws-dsf.processing.SparkEmrContainersRuntime.property.podTemplateS3LocationExecutorShared"></a>

```typescript
public readonly podTemplateS3LocationExecutorShared: string;
```

- *Type:* string

The S3 location holding the executor pod tempalte for shared nodes.

---

##### `podTemplateS3LocationNotebookDriver`<sup>Optional</sup> <a name="podTemplateS3LocationNotebookDriver" id="aws-dsf.processing.SparkEmrContainersRuntime.property.podTemplateS3LocationNotebookDriver"></a>

```typescript
public readonly podTemplateS3LocationNotebookDriver: string;
```

- *Type:* string

The S3 location holding the driver pod tempalte for interactive sessions.

---

##### `podTemplateS3LocationNotebookExecutor`<sup>Optional</sup> <a name="podTemplateS3LocationNotebookExecutor" id="aws-dsf.processing.SparkEmrContainersRuntime.property.podTemplateS3LocationNotebookExecutor"></a>

```typescript
public readonly podTemplateS3LocationNotebookExecutor: string;
```

- *Type:* string

The S3 location holding the executor pod tempalte for interactive sessions.

---

##### `s3VpcEndpoint`<sup>Optional</sup> <a name="s3VpcEndpoint" id="aws-dsf.processing.SparkEmrContainersRuntime.property.s3VpcEndpoint"></a>

```typescript
public readonly s3VpcEndpoint: IGatewayVpcEndpoint;
```

- *Type:* aws-cdk-lib.aws_ec2.IGatewayVpcEndpoint

The S3 VPC endpoint attached to the private subnets of the VPC when VPC is created.

---

##### `sharedDefaultConfig`<sup>Optional</sup> <a name="sharedDefaultConfig" id="aws-dsf.processing.SparkEmrContainersRuntime.property.sharedDefaultConfig"></a>

```typescript
public readonly sharedDefaultConfig: string;
```

- *Type:* string

The configuration override for the spark application to use with the default nodes for none criticale jobs.

---

#### Constants <a name="Constants" id="Constants"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntime.property.DEFAULT_CLUSTER_NAME">DEFAULT_CLUSTER_NAME</a></code> | <code>string</code> | The default name of the EKS cluster. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntime.property.DEFAULT_EKS_VERSION">DEFAULT_EKS_VERSION</a></code> | <code>aws-cdk-lib.aws_eks.KubernetesVersion</code> | The default EKS version. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntime.property.DEFAULT_EMR_EKS_VERSION">DEFAULT_EMR_EKS_VERSION</a></code> | <code>aws-dsf.processing.EmrRuntimeVersion</code> | The default EMR on EKS version. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntime.property.DEFAULT_VPC_CIDR">DEFAULT_VPC_CIDR</a></code> | <code>string</code> | The default CIDR when the VPC is created. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntime.property.DSF_OWNED_TAG">DSF_OWNED_TAG</a></code> | <code>string</code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntime.property.DSF_TRACKING_CODE">DSF_TRACKING_CODE</a></code> | <code>string</code> | *No description.* |

---

##### `DEFAULT_CLUSTER_NAME`<sup>Required</sup> <a name="DEFAULT_CLUSTER_NAME" id="aws-dsf.processing.SparkEmrContainersRuntime.property.DEFAULT_CLUSTER_NAME"></a>

```typescript
public readonly DEFAULT_CLUSTER_NAME: string;
```

- *Type:* string

The default name of the EKS cluster.

---

##### `DEFAULT_EKS_VERSION`<sup>Required</sup> <a name="DEFAULT_EKS_VERSION" id="aws-dsf.processing.SparkEmrContainersRuntime.property.DEFAULT_EKS_VERSION"></a>

```typescript
public readonly DEFAULT_EKS_VERSION: KubernetesVersion;
```

- *Type:* aws-cdk-lib.aws_eks.KubernetesVersion

The default EKS version.

---

##### `DEFAULT_EMR_EKS_VERSION`<sup>Required</sup> <a name="DEFAULT_EMR_EKS_VERSION" id="aws-dsf.processing.SparkEmrContainersRuntime.property.DEFAULT_EMR_EKS_VERSION"></a>

```typescript
public readonly DEFAULT_EMR_EKS_VERSION: EmrRuntimeVersion;
```

- *Type:* aws-dsf.processing.EmrRuntimeVersion

The default EMR on EKS version.

---

##### `DEFAULT_VPC_CIDR`<sup>Required</sup> <a name="DEFAULT_VPC_CIDR" id="aws-dsf.processing.SparkEmrContainersRuntime.property.DEFAULT_VPC_CIDR"></a>

```typescript
public readonly DEFAULT_VPC_CIDR: string;
```

- *Type:* string

The default CIDR when the VPC is created.

---

##### `DSF_OWNED_TAG`<sup>Required</sup> <a name="DSF_OWNED_TAG" id="aws-dsf.processing.SparkEmrContainersRuntime.property.DSF_OWNED_TAG"></a>

```typescript
public readonly DSF_OWNED_TAG: string;
```

- *Type:* string

---

##### `DSF_TRACKING_CODE`<sup>Required</sup> <a name="DSF_TRACKING_CODE" id="aws-dsf.processing.SparkEmrContainersRuntime.property.DSF_TRACKING_CODE"></a>

```typescript
public readonly DSF_TRACKING_CODE: string;
```

- *Type:* string

---

### SparkEmrEksJob <a name="SparkEmrEksJob" id="aws-dsf.processing.SparkEmrEksJob"></a>

A construct to run Spark Jobs using EMR on EKS.

Creates a Step Functions State Machine that orchestrates the Spark Job.

> [https://awslabs.github.io/data-solutions-framework-on-aws/docs/constructs/library/spark-job](https://awslabs.github.io/data-solutions-framework-on-aws/docs/constructs/library/spark-job)

*Example*

```typescript
import { JsonPath } from 'aws-cdk-lib/aws-stepfunctions';

const job = new dsf.processing.SparkEmrEksJob(this, 'SparkJob', {
  jobConfig:{
    "Name": JsonPath.format('ge_profile-{}', JsonPath.uuid()),
    "VirtualClusterId": "virtualClusterId",
    "ExecutionRoleArn": "ROLE-ARN",
    "JobDriver": {
      "SparkSubmit": {
          "EntryPoint": "s3://S3-BUCKET/pi.py",
          "EntryPointArguments": [],
          "SparkSubmitParameters": "--conf spark.executor.instances=2 --conf spark.executor.memory=2G --conf spark.driver.memory=2G --conf spark.executor.cores=4"
      },
    }
  }
} as dsf.processing.SparkEmrEksJobApiProps);

new cdk.CfnOutput(this, 'SparkJobStateMachine', {
  value: job.stateMachine!.stateMachineArn,
});
```


#### Initializers <a name="Initializers" id="aws-dsf.processing.SparkEmrEksJob.Initializer"></a>

```typescript
import { processing } from 'aws-dsf'

new processing.SparkEmrEksJob(scope: Construct, id: string, props: SparkEmrEksJobProps | SparkEmrEksJobApiProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.processing.SparkEmrEksJob.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkEmrEksJob.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkEmrEksJob.Initializer.parameter.props">props</a></code> | <code>aws-dsf.processing.SparkEmrEksJobProps \| aws-dsf.processing.SparkEmrEksJobApiProps</code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="aws-dsf.processing.SparkEmrEksJob.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="aws-dsf.processing.SparkEmrEksJob.Initializer.parameter.id"></a>

- *Type:* string

---

##### `props`<sup>Required</sup> <a name="props" id="aws-dsf.processing.SparkEmrEksJob.Initializer.parameter.props"></a>

- *Type:* aws-dsf.processing.SparkEmrEksJobProps | aws-dsf.processing.SparkEmrEksJobApiProps

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-dsf.processing.SparkEmrEksJob.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#aws-dsf.processing.SparkEmrEksJob.retrieveVersion">retrieveVersion</a></code> | Retrieve DSF package.json version. |

---

##### `toString` <a name="toString" id="aws-dsf.processing.SparkEmrEksJob.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `retrieveVersion` <a name="retrieveVersion" id="aws-dsf.processing.SparkEmrEksJob.retrieveVersion"></a>

```typescript
public retrieveVersion(): any
```

Retrieve DSF package.json version.

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-dsf.processing.SparkEmrEksJob.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |

---

##### `isConstruct` <a name="isConstruct" id="aws-dsf.processing.SparkEmrEksJob.isConstruct"></a>

```typescript
import { processing } from 'aws-dsf'

processing.SparkEmrEksJob.isConstruct(x: any)
```

Checks if `x` is a construct.

Use this method instead of `instanceof` to properly detect `Construct`
instances, even when the construct library is symlinked.

Explanation: in JavaScript, multiple copies of the `constructs` library on
disk are seen as independent, completely different libraries. As a
consequence, the class `Construct` in each copy of the `constructs` library
is seen as a different class, and an instance of one class will not test as
`instanceof` the other class. `npm install` will not create installations
like this, but users may manually symlink construct libraries together or
use a monorepo tool: in those cases, multiple copies of the `constructs`
library can be accidentally installed, and `instanceof` will behave
unpredictably. It is safest to avoid using `instanceof`, and using
this type-testing method instead.

###### `x`<sup>Required</sup> <a name="x" id="aws-dsf.processing.SparkEmrEksJob.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.processing.SparkEmrEksJob.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#aws-dsf.processing.SparkEmrEksJob.property.stateMachine">stateMachine</a></code> | <code>aws-cdk-lib.aws_stepfunctions.StateMachine</code> | Step Functions StateMachine created to orchestrate the Spark Job. |
| <code><a href="#aws-dsf.processing.SparkEmrEksJob.property.stateMachineLogGroup">stateMachineLogGroup</a></code> | <code>aws-cdk-lib.aws_logs.ILogGroup</code> | The CloudWatch Log Group used by the State Machine. |

---

##### `node`<sup>Required</sup> <a name="node" id="aws-dsf.processing.SparkEmrEksJob.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `stateMachine`<sup>Optional</sup> <a name="stateMachine" id="aws-dsf.processing.SparkEmrEksJob.property.stateMachine"></a>

```typescript
public readonly stateMachine: StateMachine;
```

- *Type:* aws-cdk-lib.aws_stepfunctions.StateMachine

Step Functions StateMachine created to orchestrate the Spark Job.

---

##### `stateMachineLogGroup`<sup>Optional</sup> <a name="stateMachineLogGroup" id="aws-dsf.processing.SparkEmrEksJob.property.stateMachineLogGroup"></a>

```typescript
public readonly stateMachineLogGroup: ILogGroup;
```

- *Type:* aws-cdk-lib.aws_logs.ILogGroup

The CloudWatch Log Group used by the State Machine.

---

#### Constants <a name="Constants" id="Constants"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.processing.SparkEmrEksJob.property.DSF_OWNED_TAG">DSF_OWNED_TAG</a></code> | <code>string</code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkEmrEksJob.property.DSF_TRACKING_CODE">DSF_TRACKING_CODE</a></code> | <code>string</code> | *No description.* |

---

##### `DSF_OWNED_TAG`<sup>Required</sup> <a name="DSF_OWNED_TAG" id="aws-dsf.processing.SparkEmrEksJob.property.DSF_OWNED_TAG"></a>

```typescript
public readonly DSF_OWNED_TAG: string;
```

- *Type:* string

---

##### `DSF_TRACKING_CODE`<sup>Required</sup> <a name="DSF_TRACKING_CODE" id="aws-dsf.processing.SparkEmrEksJob.property.DSF_TRACKING_CODE"></a>

```typescript
public readonly DSF_TRACKING_CODE: string;
```

- *Type:* string

---

### SparkEmrServerlessJob <a name="SparkEmrServerlessJob" id="aws-dsf.processing.SparkEmrServerlessJob"></a>

A construct to run Spark Jobs using EMR Serverless.

Creates a State Machine that orchestrates the Spark Job.

> [https://awslabs.github.io/data-solutions-framework-on-aws/docs/constructs/library/spark-job](https://awslabs.github.io/data-solutions-framework-on-aws/docs/constructs/library/spark-job)

*Example*

```typescript
import { PolicyDocument, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { JsonPath } from 'aws-cdk-lib/aws-stepfunctions';

const myFileSystemPolicy = new PolicyDocument({
  statements: [new PolicyStatement({
    actions: [
      's3:GetObject',
    ],
    resources: ['*'],
  })],
});


const myExecutionRole = dsf.processing.SparkEmrServerlessRuntime.createExecutionRole(this, 'execRole1', myFileSystemPolicy);
const applicationId = "APPLICATION_ID";
const job = new dsf.processing.SparkEmrServerlessJob(this, 'SparkJob', {
  jobConfig:{
    "Name": JsonPath.format('ge_profile-{}', JsonPath.uuid()),
    "ApplicationId": applicationId,
    "ExecutionRoleArn": myExecutionRole.roleArn,
    "JobDriver": {
      "SparkSubmit": {
          "EntryPoint": "s3://S3-BUCKET/pi.py",
          "EntryPointArguments": [],
          "SparkSubmitParameters": "--conf spark.executor.instances=2 --conf spark.executor.memory=2G --conf spark.driver.memory=2G --conf spark.executor.cores=4"
      },
    }
  }
} as dsf.processing.SparkEmrServerlessJobApiProps);

new cdk.CfnOutput(this, 'SparkJobStateMachine', {
  value: job.stateMachine!.stateMachineArn,
});
```


#### Initializers <a name="Initializers" id="aws-dsf.processing.SparkEmrServerlessJob.Initializer"></a>

```typescript
import { processing } from 'aws-dsf'

new processing.SparkEmrServerlessJob(scope: Construct, id: string, props: SparkEmrServerlessJobProps | SparkEmrServerlessJobApiProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessJob.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessJob.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessJob.Initializer.parameter.props">props</a></code> | <code>aws-dsf.processing.SparkEmrServerlessJobProps \| aws-dsf.processing.SparkEmrServerlessJobApiProps</code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="aws-dsf.processing.SparkEmrServerlessJob.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="aws-dsf.processing.SparkEmrServerlessJob.Initializer.parameter.id"></a>

- *Type:* string

---

##### `props`<sup>Required</sup> <a name="props" id="aws-dsf.processing.SparkEmrServerlessJob.Initializer.parameter.props"></a>

- *Type:* aws-dsf.processing.SparkEmrServerlessJobProps | aws-dsf.processing.SparkEmrServerlessJobApiProps

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessJob.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessJob.retrieveVersion">retrieveVersion</a></code> | Retrieve DSF package.json version. |

---

##### `toString` <a name="toString" id="aws-dsf.processing.SparkEmrServerlessJob.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `retrieveVersion` <a name="retrieveVersion" id="aws-dsf.processing.SparkEmrServerlessJob.retrieveVersion"></a>

```typescript
public retrieveVersion(): any
```

Retrieve DSF package.json version.

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessJob.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |

---

##### `isConstruct` <a name="isConstruct" id="aws-dsf.processing.SparkEmrServerlessJob.isConstruct"></a>

```typescript
import { processing } from 'aws-dsf'

processing.SparkEmrServerlessJob.isConstruct(x: any)
```

Checks if `x` is a construct.

Use this method instead of `instanceof` to properly detect `Construct`
instances, even when the construct library is symlinked.

Explanation: in JavaScript, multiple copies of the `constructs` library on
disk are seen as independent, completely different libraries. As a
consequence, the class `Construct` in each copy of the `constructs` library
is seen as a different class, and an instance of one class will not test as
`instanceof` the other class. `npm install` will not create installations
like this, but users may manually symlink construct libraries together or
use a monorepo tool: in those cases, multiple copies of the `constructs`
library can be accidentally installed, and `instanceof` will behave
unpredictably. It is safest to avoid using `instanceof`, and using
this type-testing method instead.

###### `x`<sup>Required</sup> <a name="x" id="aws-dsf.processing.SparkEmrServerlessJob.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessJob.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessJob.property.stateMachine">stateMachine</a></code> | <code>aws-cdk-lib.aws_stepfunctions.StateMachine</code> | Step Functions StateMachine created to orchestrate the Spark Job. |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessJob.property.stateMachineLogGroup">stateMachineLogGroup</a></code> | <code>aws-cdk-lib.aws_logs.ILogGroup</code> | The CloudWatch Log Group used by the State Machine. |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessJob.property.sparkJobExecutionRole">sparkJobExecutionRole</a></code> | <code>aws-cdk-lib.aws_iam.IRole</code> | Spark Job execution role. |

---

##### `node`<sup>Required</sup> <a name="node" id="aws-dsf.processing.SparkEmrServerlessJob.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `stateMachine`<sup>Optional</sup> <a name="stateMachine" id="aws-dsf.processing.SparkEmrServerlessJob.property.stateMachine"></a>

```typescript
public readonly stateMachine: StateMachine;
```

- *Type:* aws-cdk-lib.aws_stepfunctions.StateMachine

Step Functions StateMachine created to orchestrate the Spark Job.

---

##### `stateMachineLogGroup`<sup>Optional</sup> <a name="stateMachineLogGroup" id="aws-dsf.processing.SparkEmrServerlessJob.property.stateMachineLogGroup"></a>

```typescript
public readonly stateMachineLogGroup: ILogGroup;
```

- *Type:* aws-cdk-lib.aws_logs.ILogGroup

The CloudWatch Log Group used by the State Machine.

---

##### `sparkJobExecutionRole`<sup>Optional</sup> <a name="sparkJobExecutionRole" id="aws-dsf.processing.SparkEmrServerlessJob.property.sparkJobExecutionRole"></a>

```typescript
public readonly sparkJobExecutionRole: IRole;
```

- *Type:* aws-cdk-lib.aws_iam.IRole

Spark Job execution role.

Use this property to add additional IAM permissions if necessary.

---

#### Constants <a name="Constants" id="Constants"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessJob.property.DSF_OWNED_TAG">DSF_OWNED_TAG</a></code> | <code>string</code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessJob.property.DSF_TRACKING_CODE">DSF_TRACKING_CODE</a></code> | <code>string</code> | *No description.* |

---

##### `DSF_OWNED_TAG`<sup>Required</sup> <a name="DSF_OWNED_TAG" id="aws-dsf.processing.SparkEmrServerlessJob.property.DSF_OWNED_TAG"></a>

```typescript
public readonly DSF_OWNED_TAG: string;
```

- *Type:* string

---

##### `DSF_TRACKING_CODE`<sup>Required</sup> <a name="DSF_TRACKING_CODE" id="aws-dsf.processing.SparkEmrServerlessJob.property.DSF_TRACKING_CODE"></a>

```typescript
public readonly DSF_TRACKING_CODE: string;
```

- *Type:* string

---

### SparkEmrServerlessRuntime <a name="SparkEmrServerlessRuntime" id="aws-dsf.processing.SparkEmrServerlessRuntime"></a>

A construct to create a Spark EMR Serverless Application, along with methods to create IAM roles having the least privilege.

> [https://awslabs.github.io/data-solutions-framework-on-aws/docs/constructs/library/spark-emr-serverless-runtime](https://awslabs.github.io/data-solutions-framework-on-aws/docs/constructs/library/spark-emr-serverless-runtime)

#### Initializers <a name="Initializers" id="aws-dsf.processing.SparkEmrServerlessRuntime.Initializer"></a>

```typescript
import { processing } from 'aws-dsf'

new processing.SparkEmrServerlessRuntime(scope: Construct, id: string, props: SparkEmrServerlessRuntimeProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessRuntime.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | the Scope of the CDK Construct. |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessRuntime.Initializer.parameter.id">id</a></code> | <code>string</code> | the ID of the CDK Construct. |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessRuntime.Initializer.parameter.props">props</a></code> | <code>aws-dsf.processing.SparkEmrServerlessRuntimeProps</code> | {@link SparkEmrServerlessRuntimeProps}. |

---

##### `scope`<sup>Required</sup> <a name="scope" id="aws-dsf.processing.SparkEmrServerlessRuntime.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

the Scope of the CDK Construct.

---

##### `id`<sup>Required</sup> <a name="id" id="aws-dsf.processing.SparkEmrServerlessRuntime.Initializer.parameter.id"></a>

- *Type:* string

the ID of the CDK Construct.

---

##### `props`<sup>Required</sup> <a name="props" id="aws-dsf.processing.SparkEmrServerlessRuntime.Initializer.parameter.props"></a>

- *Type:* aws-dsf.processing.SparkEmrServerlessRuntimeProps

{@link SparkEmrServerlessRuntimeProps}.

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessRuntime.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessRuntime.grantStartExecution">grantStartExecution</a></code> | A method which will grant an IAM Role the right to start and monitor a job. |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessRuntime.retrieveVersion">retrieveVersion</a></code> | Retrieve DSF package.json version. |

---

##### `toString` <a name="toString" id="aws-dsf.processing.SparkEmrServerlessRuntime.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `grantStartExecution` <a name="grantStartExecution" id="aws-dsf.processing.SparkEmrServerlessRuntime.grantStartExecution"></a>

```typescript
public grantStartExecution(startJobRole: IRole, executionRoleArn: string): void
```

A method which will grant an IAM Role the right to start and monitor a job.

The method will also attach an iam:PassRole permission to limited to the IAM Job Execution roles passed.
The excution role will be able to submit job to the EMR Serverless application created by the construct.

###### `startJobRole`<sup>Required</sup> <a name="startJobRole" id="aws-dsf.processing.SparkEmrServerlessRuntime.grantStartExecution.parameter.startJobRole"></a>

- *Type:* aws-cdk-lib.aws_iam.IRole

the role that will call the start job api and which need to have the iam:PassRole permission.

---

###### `executionRoleArn`<sup>Required</sup> <a name="executionRoleArn" id="aws-dsf.processing.SparkEmrServerlessRuntime.grantStartExecution.parameter.executionRoleArn"></a>

- *Type:* string

the role use by EMR Serverless to access resources during the job execution.

---

##### `retrieveVersion` <a name="retrieveVersion" id="aws-dsf.processing.SparkEmrServerlessRuntime.retrieveVersion"></a>

```typescript
public retrieveVersion(): any
```

Retrieve DSF package.json version.

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessRuntime.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessRuntime.createExecutionRole">createExecutionRole</a></code> | A static method which will create an execution IAM role that can be assumed by EMR Serverless The method returns the role it creates. |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessRuntime.grantStartJobExecution">grantStartJobExecution</a></code> | A static method which will grant an IAM Role the right to start and monitor a job. |

---

##### `isConstruct` <a name="isConstruct" id="aws-dsf.processing.SparkEmrServerlessRuntime.isConstruct"></a>

```typescript
import { processing } from 'aws-dsf'

processing.SparkEmrServerlessRuntime.isConstruct(x: any)
```

Checks if `x` is a construct.

Use this method instead of `instanceof` to properly detect `Construct`
instances, even when the construct library is symlinked.

Explanation: in JavaScript, multiple copies of the `constructs` library on
disk are seen as independent, completely different libraries. As a
consequence, the class `Construct` in each copy of the `constructs` library
is seen as a different class, and an instance of one class will not test as
`instanceof` the other class. `npm install` will not create installations
like this, but users may manually symlink construct libraries together or
use a monorepo tool: in those cases, multiple copies of the `constructs`
library can be accidentally installed, and `instanceof` will behave
unpredictably. It is safest to avoid using `instanceof`, and using
this type-testing method instead.

###### `x`<sup>Required</sup> <a name="x" id="aws-dsf.processing.SparkEmrServerlessRuntime.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

##### `createExecutionRole` <a name="createExecutionRole" id="aws-dsf.processing.SparkEmrServerlessRuntime.createExecutionRole"></a>

```typescript
import { processing } from 'aws-dsf'

processing.SparkEmrServerlessRuntime.createExecutionRole(scope: Construct, id: string, executionRolePolicyDocument?: PolicyDocument, iamPolicyName?: string)
```

A static method which will create an execution IAM role that can be assumed by EMR Serverless The method returns the role it creates.

If no `executionRolePolicyDocument` or `iamPolicyName`
The method will return a role with only a trust policy to EMR Servereless service principal.
You can use this role then to grant access to any resources you control.

###### `scope`<sup>Required</sup> <a name="scope" id="aws-dsf.processing.SparkEmrServerlessRuntime.createExecutionRole.parameter.scope"></a>

- *Type:* constructs.Construct

the scope in which to create the role.

---

###### `id`<sup>Required</sup> <a name="id" id="aws-dsf.processing.SparkEmrServerlessRuntime.createExecutionRole.parameter.id"></a>

- *Type:* string

passed to the IAM Role construct object.

---

###### `executionRolePolicyDocument`<sup>Optional</sup> <a name="executionRolePolicyDocument" id="aws-dsf.processing.SparkEmrServerlessRuntime.createExecutionRole.parameter.executionRolePolicyDocument"></a>

- *Type:* aws-cdk-lib.aws_iam.PolicyDocument

the inline policy document to attach to the role.

These are IAM policies needed by the job.
This parameter is mutually execlusive with iamPolicyName.

---

###### `iamPolicyName`<sup>Optional</sup> <a name="iamPolicyName" id="aws-dsf.processing.SparkEmrServerlessRuntime.createExecutionRole.parameter.iamPolicyName"></a>

- *Type:* string

the IAM policy name to attach to the role, this is mutually execlusive with executionRolePolicyDocument.

---

##### `grantStartJobExecution` <a name="grantStartJobExecution" id="aws-dsf.processing.SparkEmrServerlessRuntime.grantStartJobExecution"></a>

```typescript
import { processing } from 'aws-dsf'

processing.SparkEmrServerlessRuntime.grantStartJobExecution(startJobRole: IRole, executionRoleArn: string[], applicationArns: string[])
```

A static method which will grant an IAM Role the right to start and monitor a job.

The method will also attach an iam:PassRole permission limited to the IAM Job Execution roles passed

###### `startJobRole`<sup>Required</sup> <a name="startJobRole" id="aws-dsf.processing.SparkEmrServerlessRuntime.grantStartJobExecution.parameter.startJobRole"></a>

- *Type:* aws-cdk-lib.aws_iam.IRole

the role that will call the start job api and which needs to have the iam:PassRole permission.

---

###### `executionRoleArn`<sup>Required</sup> <a name="executionRoleArn" id="aws-dsf.processing.SparkEmrServerlessRuntime.grantStartJobExecution.parameter.executionRoleArn"></a>

- *Type:* string[]

the role used by EMR Serverless to access resources during the job execution.

---

###### `applicationArns`<sup>Required</sup> <a name="applicationArns" id="aws-dsf.processing.SparkEmrServerlessRuntime.grantStartJobExecution.parameter.applicationArns"></a>

- *Type:* string[]

the EMR Serverless aplication ARN, this is used by the method to limit the EMR Serverless applications the role can submit job to.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessRuntime.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessRuntime.property.application">application</a></code> | <code>aws-cdk-lib.aws_emrserverless.CfnApplication</code> | The EMR Serverless application. |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessRuntime.property.emrApplicationSecurityGroup">emrApplicationSecurityGroup</a></code> | <code>aws-cdk-lib.aws_ec2.ISecurityGroup</code> | If no VPC is provided, one is created by default along with a security group attached to the EMR Serverless Application This attribute is used to expose the security group, if you provide your own security group through the {@link SparkEmrServerlessRuntimeProps} the attribute will be `undefined`. |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessRuntime.property.flowLogGroup">flowLogGroup</a></code> | <code>aws-cdk-lib.aws_logs.ILogGroup</code> | The CloudWatch Log Group for the VPC flow log when the VPC is created. |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessRuntime.property.flowLogKey">flowLogKey</a></code> | <code>aws-cdk-lib.aws_kms.IKey</code> | The KMS Key used for the VPC flow log when the VPC is created. |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessRuntime.property.flowLogRole">flowLogRole</a></code> | <code>aws-cdk-lib.aws_iam.IRole</code> | The IAM Role used for the VPC flow log when the VPC is created. |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessRuntime.property.s3VpcEndpoint">s3VpcEndpoint</a></code> | <code>aws-cdk-lib.aws_ec2.IGatewayVpcEndpoint</code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessRuntime.property.vpc">vpc</a></code> | <code>aws-cdk-lib.aws_ec2.IVpc</code> | The VPC used by the EKS cluster. |

---

##### `node`<sup>Required</sup> <a name="node" id="aws-dsf.processing.SparkEmrServerlessRuntime.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `application`<sup>Required</sup> <a name="application" id="aws-dsf.processing.SparkEmrServerlessRuntime.property.application"></a>

```typescript
public readonly application: CfnApplication;
```

- *Type:* aws-cdk-lib.aws_emrserverless.CfnApplication

The EMR Serverless application.

---

##### `emrApplicationSecurityGroup`<sup>Optional</sup> <a name="emrApplicationSecurityGroup" id="aws-dsf.processing.SparkEmrServerlessRuntime.property.emrApplicationSecurityGroup"></a>

```typescript
public readonly emrApplicationSecurityGroup: ISecurityGroup;
```

- *Type:* aws-cdk-lib.aws_ec2.ISecurityGroup

If no VPC is provided, one is created by default along with a security group attached to the EMR Serverless Application This attribute is used to expose the security group, if you provide your own security group through the {@link SparkEmrServerlessRuntimeProps} the attribute will be `undefined`.

---

##### `flowLogGroup`<sup>Optional</sup> <a name="flowLogGroup" id="aws-dsf.processing.SparkEmrServerlessRuntime.property.flowLogGroup"></a>

```typescript
public readonly flowLogGroup: ILogGroup;
```

- *Type:* aws-cdk-lib.aws_logs.ILogGroup

The CloudWatch Log Group for the VPC flow log when the VPC is created.

---

##### `flowLogKey`<sup>Optional</sup> <a name="flowLogKey" id="aws-dsf.processing.SparkEmrServerlessRuntime.property.flowLogKey"></a>

```typescript
public readonly flowLogKey: IKey;
```

- *Type:* aws-cdk-lib.aws_kms.IKey

The KMS Key used for the VPC flow log when the VPC is created.

---

##### `flowLogRole`<sup>Optional</sup> <a name="flowLogRole" id="aws-dsf.processing.SparkEmrServerlessRuntime.property.flowLogRole"></a>

```typescript
public readonly flowLogRole: IRole;
```

- *Type:* aws-cdk-lib.aws_iam.IRole

The IAM Role used for the VPC flow log when the VPC is created.

---

##### `s3VpcEndpoint`<sup>Optional</sup> <a name="s3VpcEndpoint" id="aws-dsf.processing.SparkEmrServerlessRuntime.property.s3VpcEndpoint"></a>

```typescript
public readonly s3VpcEndpoint: IGatewayVpcEndpoint;
```

- *Type:* aws-cdk-lib.aws_ec2.IGatewayVpcEndpoint

---

##### `vpc`<sup>Optional</sup> <a name="vpc" id="aws-dsf.processing.SparkEmrServerlessRuntime.property.vpc"></a>

```typescript
public readonly vpc: IVpc;
```

- *Type:* aws-cdk-lib.aws_ec2.IVpc

The VPC used by the EKS cluster.

---

#### Constants <a name="Constants" id="Constants"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessRuntime.property.DSF_OWNED_TAG">DSF_OWNED_TAG</a></code> | <code>string</code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessRuntime.property.DSF_TRACKING_CODE">DSF_TRACKING_CODE</a></code> | <code>string</code> | *No description.* |

---

##### `DSF_OWNED_TAG`<sup>Required</sup> <a name="DSF_OWNED_TAG" id="aws-dsf.processing.SparkEmrServerlessRuntime.property.DSF_OWNED_TAG"></a>

```typescript
public readonly DSF_OWNED_TAG: string;
```

- *Type:* string

---

##### `DSF_TRACKING_CODE`<sup>Required</sup> <a name="DSF_TRACKING_CODE" id="aws-dsf.processing.SparkEmrServerlessRuntime.property.DSF_TRACKING_CODE"></a>

```typescript
public readonly DSF_TRACKING_CODE: string;
```

- *Type:* string

---

### SparkJob <a name="SparkJob" id="aws-dsf.processing.SparkJob"></a>

A base construct to run Spark Jobs.

Creates an AWS Step Functions State Machine that orchestrates the Spark Job.

> [https://awslabs.github.io/data-solutions-framework-on-aws/docs/constructs/library/spark-job

Available implementations:
* {@link SparkEmrServerlessJob } for Emr Serverless implementation
* {@link SparkEmrEksJob } for EMR On EKS implementation](https://awslabs.github.io/data-solutions-framework-on-aws/docs/constructs/library/spark-job

Available implementations:
* {@link SparkEmrServerlessJob } for Emr Serverless implementation
* {@link SparkEmrEksJob } for EMR On EKS implementation)

#### Initializers <a name="Initializers" id="aws-dsf.processing.SparkJob.Initializer"></a>

```typescript
import { processing } from 'aws-dsf'

new processing.SparkJob(scope: Construct, id: string, trackingTag: string, props: SparkJobProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.processing.SparkJob.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | the Scope of the CDK Construct. |
| <code><a href="#aws-dsf.processing.SparkJob.Initializer.parameter.id">id</a></code> | <code>string</code> | the ID of the CDK Construct. |
| <code><a href="#aws-dsf.processing.SparkJob.Initializer.parameter.trackingTag">trackingTag</a></code> | <code>string</code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkJob.Initializer.parameter.props">props</a></code> | <code>aws-dsf.processing.SparkJobProps</code> | the SparkJobProps properties. |

---

##### `scope`<sup>Required</sup> <a name="scope" id="aws-dsf.processing.SparkJob.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

the Scope of the CDK Construct.

---

##### `id`<sup>Required</sup> <a name="id" id="aws-dsf.processing.SparkJob.Initializer.parameter.id"></a>

- *Type:* string

the ID of the CDK Construct.

---

##### `trackingTag`<sup>Required</sup> <a name="trackingTag" id="aws-dsf.processing.SparkJob.Initializer.parameter.trackingTag"></a>

- *Type:* string

---

##### `props`<sup>Required</sup> <a name="props" id="aws-dsf.processing.SparkJob.Initializer.parameter.props"></a>

- *Type:* aws-dsf.processing.SparkJobProps

the SparkJobProps properties.

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-dsf.processing.SparkJob.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#aws-dsf.processing.SparkJob.retrieveVersion">retrieveVersion</a></code> | Retrieve DSF package.json version. |

---

##### `toString` <a name="toString" id="aws-dsf.processing.SparkJob.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `retrieveVersion` <a name="retrieveVersion" id="aws-dsf.processing.SparkJob.retrieveVersion"></a>

```typescript
public retrieveVersion(): any
```

Retrieve DSF package.json version.

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-dsf.processing.SparkJob.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |

---

##### `isConstruct` <a name="isConstruct" id="aws-dsf.processing.SparkJob.isConstruct"></a>

```typescript
import { processing } from 'aws-dsf'

processing.SparkJob.isConstruct(x: any)
```

Checks if `x` is a construct.

Use this method instead of `instanceof` to properly detect `Construct`
instances, even when the construct library is symlinked.

Explanation: in JavaScript, multiple copies of the `constructs` library on
disk are seen as independent, completely different libraries. As a
consequence, the class `Construct` in each copy of the `constructs` library
is seen as a different class, and an instance of one class will not test as
`instanceof` the other class. `npm install` will not create installations
like this, but users may manually symlink construct libraries together or
use a monorepo tool: in those cases, multiple copies of the `constructs`
library can be accidentally installed, and `instanceof` will behave
unpredictably. It is safest to avoid using `instanceof`, and using
this type-testing method instead.

###### `x`<sup>Required</sup> <a name="x" id="aws-dsf.processing.SparkJob.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.processing.SparkJob.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#aws-dsf.processing.SparkJob.property.stateMachine">stateMachine</a></code> | <code>aws-cdk-lib.aws_stepfunctions.StateMachine</code> | Step Functions StateMachine created to orchestrate the Spark Job. |
| <code><a href="#aws-dsf.processing.SparkJob.property.stateMachineLogGroup">stateMachineLogGroup</a></code> | <code>aws-cdk-lib.aws_logs.ILogGroup</code> | The CloudWatch Log Group used by the State Machine. |

---

##### `node`<sup>Required</sup> <a name="node" id="aws-dsf.processing.SparkJob.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `stateMachine`<sup>Optional</sup> <a name="stateMachine" id="aws-dsf.processing.SparkJob.property.stateMachine"></a>

```typescript
public readonly stateMachine: StateMachine;
```

- *Type:* aws-cdk-lib.aws_stepfunctions.StateMachine

Step Functions StateMachine created to orchestrate the Spark Job.

---

##### `stateMachineLogGroup`<sup>Optional</sup> <a name="stateMachineLogGroup" id="aws-dsf.processing.SparkJob.property.stateMachineLogGroup"></a>

```typescript
public readonly stateMachineLogGroup: ILogGroup;
```

- *Type:* aws-cdk-lib.aws_logs.ILogGroup

The CloudWatch Log Group used by the State Machine.

---

#### Constants <a name="Constants" id="Constants"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.processing.SparkJob.property.DSF_OWNED_TAG">DSF_OWNED_TAG</a></code> | <code>string</code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkJob.property.DSF_TRACKING_CODE">DSF_TRACKING_CODE</a></code> | <code>string</code> | *No description.* |

---

##### `DSF_OWNED_TAG`<sup>Required</sup> <a name="DSF_OWNED_TAG" id="aws-dsf.processing.SparkJob.property.DSF_OWNED_TAG"></a>

```typescript
public readonly DSF_OWNED_TAG: string;
```

- *Type:* string

---

##### `DSF_TRACKING_CODE`<sup>Required</sup> <a name="DSF_TRACKING_CODE" id="aws-dsf.processing.SparkJob.property.DSF_TRACKING_CODE"></a>

```typescript
public readonly DSF_TRACKING_CODE: string;
```

- *Type:* string

---

## Structs <a name="Structs" id="Structs"></a>

### AnalyticsBucketProps <a name="AnalyticsBucketProps" id="aws-dsf.storage.AnalyticsBucketProps"></a>

Properties of the {@link AnalyticsBucket } construct.

#### Initializer <a name="Initializer" id="aws-dsf.storage.AnalyticsBucketProps.Initializer"></a>

```typescript
import { storage } from 'aws-dsf'

const analyticsBucketProps: storage.AnalyticsBucketProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.storage.AnalyticsBucketProps.property.encryptionKey">encryptionKey</a></code> | <code>aws-cdk-lib.aws_kms.IKey</code> | External KMS key to use for bucket encryption. |
| <code><a href="#aws-dsf.storage.AnalyticsBucketProps.property.accessControl">accessControl</a></code> | <code>aws-cdk-lib.aws_s3.BucketAccessControl</code> | Specifies a canned ACL that grants predefined permissions to the bucket. |
| <code><a href="#aws-dsf.storage.AnalyticsBucketProps.property.autoDeleteObjects">autoDeleteObjects</a></code> | <code>boolean</code> | Whether all objects should be automatically deleted when the bucket is removed from the stack or when the stack is deleted. |
| <code><a href="#aws-dsf.storage.AnalyticsBucketProps.property.blockPublicAccess">blockPublicAccess</a></code> | <code>aws-cdk-lib.aws_s3.BlockPublicAccess</code> | The block public access configuration of this bucket. |
| <code><a href="#aws-dsf.storage.AnalyticsBucketProps.property.bucketKeyEnabled">bucketKeyEnabled</a></code> | <code>boolean</code> | Whether Amazon S3 should use its own intermediary key to generate data keys. Only relevant when using KMS for encryption. |
| <code><a href="#aws-dsf.storage.AnalyticsBucketProps.property.bucketName">bucketName</a></code> | <code>string</code> | Physical name of this bucket. |
| <code><a href="#aws-dsf.storage.AnalyticsBucketProps.property.cors">cors</a></code> | <code>aws-cdk-lib.aws_s3.CorsRule[]</code> | The CORS configuration of this bucket. |
| <code><a href="#aws-dsf.storage.AnalyticsBucketProps.property.enforceSSL">enforceSSL</a></code> | <code>boolean</code> | Enforces SSL for requests. |
| <code><a href="#aws-dsf.storage.AnalyticsBucketProps.property.eventBridgeEnabled">eventBridgeEnabled</a></code> | <code>boolean</code> | Whether this bucket should send notifications to Amazon EventBridge or not. |
| <code><a href="#aws-dsf.storage.AnalyticsBucketProps.property.intelligentTieringConfigurations">intelligentTieringConfigurations</a></code> | <code>aws-cdk-lib.aws_s3.IntelligentTieringConfiguration[]</code> | Inteligent Tiering Configurations. |
| <code><a href="#aws-dsf.storage.AnalyticsBucketProps.property.inventories">inventories</a></code> | <code>aws-cdk-lib.aws_s3.Inventory[]</code> | The inventory configuration of the bucket. |
| <code><a href="#aws-dsf.storage.AnalyticsBucketProps.property.lifecycleRules">lifecycleRules</a></code> | <code>aws-cdk-lib.aws_s3.LifecycleRule[]</code> | Rules that define how Amazon S3 manages objects during their lifetime. |
| <code><a href="#aws-dsf.storage.AnalyticsBucketProps.property.metrics">metrics</a></code> | <code>aws-cdk-lib.aws_s3.BucketMetrics[]</code> | The metrics configuration of this bucket. |
| <code><a href="#aws-dsf.storage.AnalyticsBucketProps.property.notificationsHandlerRole">notificationsHandlerRole</a></code> | <code>aws-cdk-lib.aws_iam.IRole</code> | The role to be used by the notifications handler. |
| <code><a href="#aws-dsf.storage.AnalyticsBucketProps.property.objectLockDefaultRetention">objectLockDefaultRetention</a></code> | <code>aws-cdk-lib.aws_s3.ObjectLockRetention</code> | The default retention mode and rules for S3 Object Lock. |
| <code><a href="#aws-dsf.storage.AnalyticsBucketProps.property.objectLockEnabled">objectLockEnabled</a></code> | <code>boolean</code> | Enable object lock on the bucket. |
| <code><a href="#aws-dsf.storage.AnalyticsBucketProps.property.objectOwnership">objectOwnership</a></code> | <code>aws-cdk-lib.aws_s3.ObjectOwnership</code> | The objectOwnership of the bucket. |
| <code><a href="#aws-dsf.storage.AnalyticsBucketProps.property.publicReadAccess">publicReadAccess</a></code> | <code>boolean</code> | Grants public read access to all objects in the bucket. |
| <code><a href="#aws-dsf.storage.AnalyticsBucketProps.property.removalPolicy">removalPolicy</a></code> | <code>aws-cdk-lib.RemovalPolicy</code> | Policy to apply when the bucket is removed from this stack. |
| <code><a href="#aws-dsf.storage.AnalyticsBucketProps.property.serverAccessLogsBucket">serverAccessLogsBucket</a></code> | <code>aws-cdk-lib.aws_s3.IBucket</code> | Destination bucket for the server access logs. |
| <code><a href="#aws-dsf.storage.AnalyticsBucketProps.property.serverAccessLogsPrefix">serverAccessLogsPrefix</a></code> | <code>string</code> | Optional log file prefix to use for the bucket's access logs. |
| <code><a href="#aws-dsf.storage.AnalyticsBucketProps.property.transferAcceleration">transferAcceleration</a></code> | <code>boolean</code> | Whether this bucket should have transfer acceleration turned on or not. |
| <code><a href="#aws-dsf.storage.AnalyticsBucketProps.property.versioned">versioned</a></code> | <code>boolean</code> | Whether this bucket should have versioning turned on or not. |

---

##### `encryptionKey`<sup>Required</sup> <a name="encryptionKey" id="aws-dsf.storage.AnalyticsBucketProps.property.encryptionKey"></a>

```typescript
public readonly encryptionKey: IKey;
```

- *Type:* aws-cdk-lib.aws_kms.IKey
- *Default:* If `encryption` is set to `KMS` and this property is undefined, a new KMS key will be created and associated with this bucket.

External KMS key to use for bucket encryption.

The `encryption` property must be either not specified or set to `KMS` or `DSSE`.
An error will be emitted if `encryption` is set to `UNENCRYPTED` or `S3_MANAGED`.

---

##### `accessControl`<sup>Optional</sup> <a name="accessControl" id="aws-dsf.storage.AnalyticsBucketProps.property.accessControl"></a>

```typescript
public readonly accessControl: BucketAccessControl;
```

- *Type:* aws-cdk-lib.aws_s3.BucketAccessControl
- *Default:* BucketAccessControl.PRIVATE

Specifies a canned ACL that grants predefined permissions to the bucket.

---

##### `autoDeleteObjects`<sup>Optional</sup> <a name="autoDeleteObjects" id="aws-dsf.storage.AnalyticsBucketProps.property.autoDeleteObjects"></a>

```typescript
public readonly autoDeleteObjects: boolean;
```

- *Type:* boolean
- *Default:* false

Whether all objects should be automatically deleted when the bucket is removed from the stack or when the stack is deleted.

Requires the `removalPolicy` to be set to `RemovalPolicy.DESTROY`.

**Warning** if you have deployed a bucket with `autoDeleteObjects: true`,
switching this to `false` in a CDK version *before* `1.126.0` will lead to
all objects in the bucket being deleted. Be sure to update your bucket resources
by deploying with CDK version `1.126.0` or later **before** switching this value to `false`.

---

##### `blockPublicAccess`<sup>Optional</sup> <a name="blockPublicAccess" id="aws-dsf.storage.AnalyticsBucketProps.property.blockPublicAccess"></a>

```typescript
public readonly blockPublicAccess: BlockPublicAccess;
```

- *Type:* aws-cdk-lib.aws_s3.BlockPublicAccess
- *Default:* CloudFormation defaults will apply. New buckets and objects don't allow public access, but users can modify bucket policies or object permissions to allow public access

The block public access configuration of this bucket.

---

##### `bucketKeyEnabled`<sup>Optional</sup> <a name="bucketKeyEnabled" id="aws-dsf.storage.AnalyticsBucketProps.property.bucketKeyEnabled"></a>

```typescript
public readonly bucketKeyEnabled: boolean;
```

- *Type:* boolean
- *Default:* false

Whether Amazon S3 should use its own intermediary key to generate data keys. Only relevant when using KMS for encryption.

If not enabled, every object GET and PUT will cause an API call to KMS (with the
  attendant cost implications of that).
- If enabled, S3 will use its own time-limited key instead.

Only relevant, when Encryption is set to `BucketEncryption.KMS` or `BucketEncryption.KMS_MANAGED`.

---

##### `bucketName`<sup>Optional</sup> <a name="bucketName" id="aws-dsf.storage.AnalyticsBucketProps.property.bucketName"></a>

```typescript
public readonly bucketName: string;
```

- *Type:* string
- *Default:* `analytics-<AWS_ACCOUNT_ID>-<AWS_REGION>-<UNIQUE_ID>`

Physical name of this bucket.

---

##### `cors`<sup>Optional</sup> <a name="cors" id="aws-dsf.storage.AnalyticsBucketProps.property.cors"></a>

```typescript
public readonly cors: CorsRule[];
```

- *Type:* aws-cdk-lib.aws_s3.CorsRule[]
- *Default:* No CORS configuration.

The CORS configuration of this bucket.

---

##### `enforceSSL`<sup>Optional</sup> <a name="enforceSSL" id="aws-dsf.storage.AnalyticsBucketProps.property.enforceSSL"></a>

```typescript
public readonly enforceSSL: boolean;
```

- *Type:* boolean
- *Default:* false

Enforces SSL for requests.

S3.5 of the AWS Foundational Security Best Practices Regarding S3.

---

##### `eventBridgeEnabled`<sup>Optional</sup> <a name="eventBridgeEnabled" id="aws-dsf.storage.AnalyticsBucketProps.property.eventBridgeEnabled"></a>

```typescript
public readonly eventBridgeEnabled: boolean;
```

- *Type:* boolean
- *Default:* false

Whether this bucket should send notifications to Amazon EventBridge or not.

---

##### `intelligentTieringConfigurations`<sup>Optional</sup> <a name="intelligentTieringConfigurations" id="aws-dsf.storage.AnalyticsBucketProps.property.intelligentTieringConfigurations"></a>

```typescript
public readonly intelligentTieringConfigurations: IntelligentTieringConfiguration[];
```

- *Type:* aws-cdk-lib.aws_s3.IntelligentTieringConfiguration[]
- *Default:* No Intelligent Tiiering Configurations.

Inteligent Tiering Configurations.

---

##### `inventories`<sup>Optional</sup> <a name="inventories" id="aws-dsf.storage.AnalyticsBucketProps.property.inventories"></a>

```typescript
public readonly inventories: Inventory[];
```

- *Type:* aws-cdk-lib.aws_s3.Inventory[]
- *Default:* No inventory configuration

The inventory configuration of the bucket.

---

##### `lifecycleRules`<sup>Optional</sup> <a name="lifecycleRules" id="aws-dsf.storage.AnalyticsBucketProps.property.lifecycleRules"></a>

```typescript
public readonly lifecycleRules: LifecycleRule[];
```

- *Type:* aws-cdk-lib.aws_s3.LifecycleRule[]
- *Default:* No lifecycle rules.

Rules that define how Amazon S3 manages objects during their lifetime.

---

##### `metrics`<sup>Optional</sup> <a name="metrics" id="aws-dsf.storage.AnalyticsBucketProps.property.metrics"></a>

```typescript
public readonly metrics: BucketMetrics[];
```

- *Type:* aws-cdk-lib.aws_s3.BucketMetrics[]
- *Default:* No metrics configuration.

The metrics configuration of this bucket.

---

##### `notificationsHandlerRole`<sup>Optional</sup> <a name="notificationsHandlerRole" id="aws-dsf.storage.AnalyticsBucketProps.property.notificationsHandlerRole"></a>

```typescript
public readonly notificationsHandlerRole: IRole;
```

- *Type:* aws-cdk-lib.aws_iam.IRole
- *Default:* a new role will be created.

The role to be used by the notifications handler.

---

##### `objectLockDefaultRetention`<sup>Optional</sup> <a name="objectLockDefaultRetention" id="aws-dsf.storage.AnalyticsBucketProps.property.objectLockDefaultRetention"></a>

```typescript
public readonly objectLockDefaultRetention: ObjectLockRetention;
```

- *Type:* aws-cdk-lib.aws_s3.ObjectLockRetention
- *Default:* no default retention period

The default retention mode and rules for S3 Object Lock.

Default retention can be configured after a bucket is created if the bucket already
has object lock enabled. Enabling object lock for existing buckets is not supported.

---

##### `objectLockEnabled`<sup>Optional</sup> <a name="objectLockEnabled" id="aws-dsf.storage.AnalyticsBucketProps.property.objectLockEnabled"></a>

```typescript
public readonly objectLockEnabled: boolean;
```

- *Type:* boolean
- *Default:* false, unless objectLockDefaultRetention is set (then, true)

Enable object lock on the bucket.

Enabling object lock for existing buckets is not supported. Object lock must be
enabled when the bucket is created.

---

##### `objectOwnership`<sup>Optional</sup> <a name="objectOwnership" id="aws-dsf.storage.AnalyticsBucketProps.property.objectOwnership"></a>

```typescript
public readonly objectOwnership: ObjectOwnership;
```

- *Type:* aws-cdk-lib.aws_s3.ObjectOwnership
- *Default:* No ObjectOwnership configuration, uploading account will own the object.

The objectOwnership of the bucket.

---

##### `publicReadAccess`<sup>Optional</sup> <a name="publicReadAccess" id="aws-dsf.storage.AnalyticsBucketProps.property.publicReadAccess"></a>

```typescript
public readonly publicReadAccess: boolean;
```

- *Type:* boolean
- *Default:* false

Grants public read access to all objects in the bucket.

Similar to calling `bucket.grantPublicAccess()`

---

##### `removalPolicy`<sup>Optional</sup> <a name="removalPolicy" id="aws-dsf.storage.AnalyticsBucketProps.property.removalPolicy"></a>

```typescript
public readonly removalPolicy: RemovalPolicy;
```

- *Type:* aws-cdk-lib.RemovalPolicy
- *Default:* RETAIN (The bucket will be orphaned).

Policy to apply when the bucket is removed from this stack.

*

---

##### `serverAccessLogsBucket`<sup>Optional</sup> <a name="serverAccessLogsBucket" id="aws-dsf.storage.AnalyticsBucketProps.property.serverAccessLogsBucket"></a>

```typescript
public readonly serverAccessLogsBucket: IBucket;
```

- *Type:* aws-cdk-lib.aws_s3.IBucket
- *Default:* If "serverAccessLogsPrefix" undefined - access logs disabled, otherwise - log to current bucket.

Destination bucket for the server access logs.

---

##### `serverAccessLogsPrefix`<sup>Optional</sup> <a name="serverAccessLogsPrefix" id="aws-dsf.storage.AnalyticsBucketProps.property.serverAccessLogsPrefix"></a>

```typescript
public readonly serverAccessLogsPrefix: string;
```

- *Type:* string
- *Default:* No log file prefix

Optional log file prefix to use for the bucket's access logs.

If defined without "serverAccessLogsBucket", enables access logs to current bucket with this prefix.

---

##### `transferAcceleration`<sup>Optional</sup> <a name="transferAcceleration" id="aws-dsf.storage.AnalyticsBucketProps.property.transferAcceleration"></a>

```typescript
public readonly transferAcceleration: boolean;
```

- *Type:* boolean
- *Default:* false

Whether this bucket should have transfer acceleration turned on or not.

---

##### `versioned`<sup>Optional</sup> <a name="versioned" id="aws-dsf.storage.AnalyticsBucketProps.property.versioned"></a>

```typescript
public readonly versioned: boolean;
```

- *Type:* boolean
- *Default:* false (unless object lock is enabled, then true)

Whether this bucket should have versioning turned on or not.

---

### ApplicationStageProps <a name="ApplicationStageProps" id="aws-dsf.utils.ApplicationStageProps"></a>

Properties for SparkCICDStage class.

#### Initializer <a name="Initializer" id="aws-dsf.utils.ApplicationStageProps.Initializer"></a>

```typescript
import { utils } from 'aws-dsf'

const applicationStageProps: utils.ApplicationStageProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.utils.ApplicationStageProps.property.env">env</a></code> | <code>aws-cdk-lib.Environment</code> | Default AWS environment (account/region) for `Stack`s in this `Stage`. |
| <code><a href="#aws-dsf.utils.ApplicationStageProps.property.outdir">outdir</a></code> | <code>string</code> | The output directory into which to emit synthesized artifacts. |
| <code><a href="#aws-dsf.utils.ApplicationStageProps.property.permissionsBoundary">permissionsBoundary</a></code> | <code>aws-cdk-lib.PermissionsBoundary</code> | Options for applying a permissions boundary to all IAM Roles and Users created within this Stage. |
| <code><a href="#aws-dsf.utils.ApplicationStageProps.property.policyValidationBeta1">policyValidationBeta1</a></code> | <code>aws-cdk-lib.IPolicyValidationPluginBeta1[]</code> | Validation plugins to run during synthesis. |
| <code><a href="#aws-dsf.utils.ApplicationStageProps.property.stageName">stageName</a></code> | <code>string</code> | Name of this stage. |
| <code><a href="#aws-dsf.utils.ApplicationStageProps.property.applicationStackFactory">applicationStackFactory</a></code> | <code>aws-dsf.utils.ApplicationStackFactory</code> | The application Stack to deploy in the different CDK Pipelines Stages. |
| <code><a href="#aws-dsf.utils.ApplicationStageProps.property.stage">stage</a></code> | <code>aws-dsf.utils.CICDStage</code> | The Stage to deploy the SparkCICDStack in. |
| <code><a href="#aws-dsf.utils.ApplicationStageProps.property.outputsEnv">outputsEnv</a></code> | <code>{[ key: string ]: string}</code> | The list of values to create CfnOutputs. |

---

##### `env`<sup>Optional</sup> <a name="env" id="aws-dsf.utils.ApplicationStageProps.property.env"></a>

```typescript
public readonly env: Environment;
```

- *Type:* aws-cdk-lib.Environment
- *Default:* The environments should be configured on the `Stack`s.

Default AWS environment (account/region) for `Stack`s in this `Stage`.

Stacks defined inside this `Stage` with either `region` or `account` missing
from its env will use the corresponding field given here.

If either `region` or `account`is is not configured for `Stack` (either on
the `Stack` itself or on the containing `Stage`), the Stack will be
*environment-agnostic*.

Environment-agnostic stacks can be deployed to any environment, may not be
able to take advantage of all features of the CDK. For example, they will
not be able to use environmental context lookups, will not automatically
translate Service Principals to the right format based on the environment's
AWS partition, and other such enhancements.

---

*Example*

```typescript
// Use a concrete account and region to deploy this Stage to
new Stage(app, 'Stage1', {
  env: { account: '123456789012', region: 'us-east-1' },
});

// Use the CLI's current credentials to determine the target environment
new Stage(app, 'Stage2', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
```


##### `outdir`<sup>Optional</sup> <a name="outdir" id="aws-dsf.utils.ApplicationStageProps.property.outdir"></a>

```typescript
public readonly outdir: string;
```

- *Type:* string
- *Default:* for nested stages, outdir will be determined as a relative directory to the outdir of the app. For apps, if outdir is not specified, a temporary directory will be created.

The output directory into which to emit synthesized artifacts.

Can only be specified if this stage is the root stage (the app). If this is
specified and this stage is nested within another stage, an error will be
thrown.

---

##### `permissionsBoundary`<sup>Optional</sup> <a name="permissionsBoundary" id="aws-dsf.utils.ApplicationStageProps.property.permissionsBoundary"></a>

```typescript
public readonly permissionsBoundary: PermissionsBoundary;
```

- *Type:* aws-cdk-lib.PermissionsBoundary
- *Default:* no permissions boundary is applied

Options for applying a permissions boundary to all IAM Roles and Users created within this Stage.

---

##### `policyValidationBeta1`<sup>Optional</sup> <a name="policyValidationBeta1" id="aws-dsf.utils.ApplicationStageProps.property.policyValidationBeta1"></a>

```typescript
public readonly policyValidationBeta1: IPolicyValidationPluginBeta1[];
```

- *Type:* aws-cdk-lib.IPolicyValidationPluginBeta1[]
- *Default:* no validation plugins are used

Validation plugins to run during synthesis.

If any plugin reports any violation,
synthesis will be interrupted and the report displayed to the user.

---

##### `stageName`<sup>Optional</sup> <a name="stageName" id="aws-dsf.utils.ApplicationStageProps.property.stageName"></a>

```typescript
public readonly stageName: string;
```

- *Type:* string
- *Default:* Derived from the id.

Name of this stage.

---

##### `applicationStackFactory`<sup>Required</sup> <a name="applicationStackFactory" id="aws-dsf.utils.ApplicationStageProps.property.applicationStackFactory"></a>

```typescript
public readonly applicationStackFactory: ApplicationStackFactory;
```

- *Type:* aws-dsf.utils.ApplicationStackFactory

The application Stack to deploy in the different CDK Pipelines Stages.

---

##### `stage`<sup>Required</sup> <a name="stage" id="aws-dsf.utils.ApplicationStageProps.property.stage"></a>

```typescript
public readonly stage: CICDStage;
```

- *Type:* aws-dsf.utils.CICDStage
- *Default:* No stage is passed to the application stack

The Stage to deploy the SparkCICDStack in.

---

##### `outputsEnv`<sup>Optional</sup> <a name="outputsEnv" id="aws-dsf.utils.ApplicationStageProps.property.outputsEnv"></a>

```typescript
public readonly outputsEnv: {[ key: string ]: string};
```

- *Type:* {[ key: string ]: string}
- *Default:* No CfnOutputs are created

The list of values to create CfnOutputs.

---

### DataCatalogDatabaseProps <a name="DataCatalogDatabaseProps" id="aws-dsf.governance.DataCatalogDatabaseProps"></a>

The Database catalog properties.

#### Initializer <a name="Initializer" id="aws-dsf.governance.DataCatalogDatabaseProps.Initializer"></a>

```typescript
import { governance } from 'aws-dsf'

const dataCatalogDatabaseProps: governance.DataCatalogDatabaseProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.governance.DataCatalogDatabaseProps.property.locationBucket">locationBucket</a></code> | <code>aws-cdk-lib.aws_s3.IBucket</code> | S3 bucket where data is stored. |
| <code><a href="#aws-dsf.governance.DataCatalogDatabaseProps.property.locationPrefix">locationPrefix</a></code> | <code>string</code> | Top level location wwhere table data is stored. |
| <code><a href="#aws-dsf.governance.DataCatalogDatabaseProps.property.name">name</a></code> | <code>string</code> | Database name. |
| <code><a href="#aws-dsf.governance.DataCatalogDatabaseProps.property.autoCrawl">autoCrawl</a></code> | <code>boolean</code> | When enabled, this automatically creates a top level Glue Crawler that would run based on the defined schedule in the `autoCrawlSchedule` parameter. |
| <code><a href="#aws-dsf.governance.DataCatalogDatabaseProps.property.autoCrawlSchedule">autoCrawlSchedule</a></code> | <code>aws-cdk-lib.aws_glue.CfnCrawler.ScheduleProperty</code> | The schedule when the Crawler would run. |
| <code><a href="#aws-dsf.governance.DataCatalogDatabaseProps.property.crawlerLogEncryptionKey">crawlerLogEncryptionKey</a></code> | <code>aws-cdk-lib.aws_kms.IKey</code> | Encryption key used for Crawler logs. |
| <code><a href="#aws-dsf.governance.DataCatalogDatabaseProps.property.crawlerRole">crawlerRole</a></code> | <code>aws-cdk-lib.aws_iam.IRole</code> | When passed, the crawler that would be created when `autoCrawl` is set to `True` would used this role. |
| <code><a href="#aws-dsf.governance.DataCatalogDatabaseProps.property.crawlerTableLevelDepth">crawlerTableLevelDepth</a></code> | <code>number</code> | Directory depth where the table folders are located. |
| <code><a href="#aws-dsf.governance.DataCatalogDatabaseProps.property.removalPolicy">removalPolicy</a></code> | <code>aws-cdk-lib.RemovalPolicy</code> | Policy to apply when the bucket is removed from this stack. |

---

##### `locationBucket`<sup>Required</sup> <a name="locationBucket" id="aws-dsf.governance.DataCatalogDatabaseProps.property.locationBucket"></a>

```typescript
public readonly locationBucket: IBucket;
```

- *Type:* aws-cdk-lib.aws_s3.IBucket

S3 bucket where data is stored.

---

##### `locationPrefix`<sup>Required</sup> <a name="locationPrefix" id="aws-dsf.governance.DataCatalogDatabaseProps.property.locationPrefix"></a>

```typescript
public readonly locationPrefix: string;
```

- *Type:* string

Top level location wwhere table data is stored.

---

##### `name`<sup>Required</sup> <a name="name" id="aws-dsf.governance.DataCatalogDatabaseProps.property.name"></a>

```typescript
public readonly name: string;
```

- *Type:* string

Database name.

Construct would add a randomize suffix as part of the name to prevent name collisions.

---

##### `autoCrawl`<sup>Optional</sup> <a name="autoCrawl" id="aws-dsf.governance.DataCatalogDatabaseProps.property.autoCrawl"></a>

```typescript
public readonly autoCrawl: boolean;
```

- *Type:* boolean
- *Default:* True

When enabled, this automatically creates a top level Glue Crawler that would run based on the defined schedule in the `autoCrawlSchedule` parameter.

---

##### `autoCrawlSchedule`<sup>Optional</sup> <a name="autoCrawlSchedule" id="aws-dsf.governance.DataCatalogDatabaseProps.property.autoCrawlSchedule"></a>

```typescript
public readonly autoCrawlSchedule: ScheduleProperty;
```

- *Type:* aws-cdk-lib.aws_glue.CfnCrawler.ScheduleProperty
- *Default:* `cron(1 0 * * ? *)`

The schedule when the Crawler would run.

Default is once a day at 00:01h.

---

##### `crawlerLogEncryptionKey`<sup>Optional</sup> <a name="crawlerLogEncryptionKey" id="aws-dsf.governance.DataCatalogDatabaseProps.property.crawlerLogEncryptionKey"></a>

```typescript
public readonly crawlerLogEncryptionKey: IKey;
```

- *Type:* aws-cdk-lib.aws_kms.IKey
- *Default:* Create a new key if none is provided

Encryption key used for Crawler logs.

---

##### `crawlerRole`<sup>Optional</sup> <a name="crawlerRole" id="aws-dsf.governance.DataCatalogDatabaseProps.property.crawlerRole"></a>

```typescript
public readonly crawlerRole: IRole;
```

- *Type:* aws-cdk-lib.aws_iam.IRole
- *Default:* A new role would be created with least privilege permissions to run the crawler

When passed, the crawler that would be created when `autoCrawl` is set to `True` would used this role.

Additional permissions would be granted to this role such as S3 Bucket read only permissions and KMS encrypt/decrypt on the key used by the Glue Crawler logging to CloudWatch Logs.

---

##### `crawlerTableLevelDepth`<sup>Optional</sup> <a name="crawlerTableLevelDepth" id="aws-dsf.governance.DataCatalogDatabaseProps.property.crawlerTableLevelDepth"></a>

```typescript
public readonly crawlerTableLevelDepth: number;
```

- *Type:* number
- *Default:* calculated based on `locationPrefix`

Directory depth where the table folders are located.

This helps the crawler understand the layout of the folders in S3.

---

##### `removalPolicy`<sup>Optional</sup> <a name="removalPolicy" id="aws-dsf.governance.DataCatalogDatabaseProps.property.removalPolicy"></a>

```typescript
public readonly removalPolicy: RemovalPolicy;
```

- *Type:* aws-cdk-lib.RemovalPolicy
- *Default:* RETAIN (The bucket will be orphaned).

Policy to apply when the bucket is removed from this stack.

*

---

### DataLakeCatalogProps <a name="DataLakeCatalogProps" id="aws-dsf.governance.DataLakeCatalogProps"></a>

Properties for the DataLakeCatalog Construct.

#### Initializer <a name="Initializer" id="aws-dsf.governance.DataLakeCatalogProps.Initializer"></a>

```typescript
import { governance } from 'aws-dsf'

const dataLakeCatalogProps: governance.DataLakeCatalogProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.governance.DataLakeCatalogProps.property.dataLakeStorage">dataLakeStorage</a></code> | <code>aws-dsf.storage.DataLakeStorage</code> | Location of data lake files. |
| <code><a href="#aws-dsf.governance.DataLakeCatalogProps.property.autoCrawl">autoCrawl</a></code> | <code>boolean</code> | When enabled, this automatically creates a top level Glue Crawler that would run based on the defined schedule in the `autoCrawlSchedule` parameter. |
| <code><a href="#aws-dsf.governance.DataLakeCatalogProps.property.autoCrawlSchedule">autoCrawlSchedule</a></code> | <code>aws-cdk-lib.aws_glue.CfnCrawler.ScheduleProperty</code> | The schedule when the Crawler would run. |
| <code><a href="#aws-dsf.governance.DataLakeCatalogProps.property.crawlerLogEncryptionKey">crawlerLogEncryptionKey</a></code> | <code>aws-cdk-lib.aws_kms.IKey</code> | Encryption key used for Crawler logs. |
| <code><a href="#aws-dsf.governance.DataLakeCatalogProps.property.crawlerTableLevelDepth">crawlerTableLevelDepth</a></code> | <code>number</code> | Directory depth where the table folders are located. |
| <code><a href="#aws-dsf.governance.DataLakeCatalogProps.property.databaseName">databaseName</a></code> | <code>string</code> | The suffix of the database in the Glue Data Catalog. |
| <code><a href="#aws-dsf.governance.DataLakeCatalogProps.property.removalPolicy">removalPolicy</a></code> | <code>aws-cdk-lib.RemovalPolicy</code> | Policy to apply when the bucket is removed from this stack. |

---

##### `dataLakeStorage`<sup>Required</sup> <a name="dataLakeStorage" id="aws-dsf.governance.DataLakeCatalogProps.property.dataLakeStorage"></a>

```typescript
public readonly dataLakeStorage: DataLakeStorage;
```

- *Type:* aws-dsf.storage.DataLakeStorage

Location of data lake files.

---

##### `autoCrawl`<sup>Optional</sup> <a name="autoCrawl" id="aws-dsf.governance.DataLakeCatalogProps.property.autoCrawl"></a>

```typescript
public readonly autoCrawl: boolean;
```

- *Type:* boolean
- *Default:* True

When enabled, this automatically creates a top level Glue Crawler that would run based on the defined schedule in the `autoCrawlSchedule` parameter.

---

##### `autoCrawlSchedule`<sup>Optional</sup> <a name="autoCrawlSchedule" id="aws-dsf.governance.DataLakeCatalogProps.property.autoCrawlSchedule"></a>

```typescript
public readonly autoCrawlSchedule: ScheduleProperty;
```

- *Type:* aws-cdk-lib.aws_glue.CfnCrawler.ScheduleProperty
- *Default:* `cron(1 0 * * ? *)`

The schedule when the Crawler would run.

Default is once a day at 00:01h.

---

##### `crawlerLogEncryptionKey`<sup>Optional</sup> <a name="crawlerLogEncryptionKey" id="aws-dsf.governance.DataLakeCatalogProps.property.crawlerLogEncryptionKey"></a>

```typescript
public readonly crawlerLogEncryptionKey: IKey;
```

- *Type:* aws-cdk-lib.aws_kms.IKey
- *Default:* Create a new key if none is provided

Encryption key used for Crawler logs.

---

##### `crawlerTableLevelDepth`<sup>Optional</sup> <a name="crawlerTableLevelDepth" id="aws-dsf.governance.DataLakeCatalogProps.property.crawlerTableLevelDepth"></a>

```typescript
public readonly crawlerTableLevelDepth: number;
```

- *Type:* number
- *Default:* calculated based on `locationPrefix`

Directory depth where the table folders are located.

This helps the crawler understand the layout of the folders in S3.

---

##### `databaseName`<sup>Optional</sup> <a name="databaseName" id="aws-dsf.governance.DataLakeCatalogProps.property.databaseName"></a>

```typescript
public readonly databaseName: string;
```

- *Type:* string
- *Default:* Use the bucket name as the database name and / as the S3 location

The suffix of the database in the Glue Data Catalog.

The name of the database is composed of the bucket name and this suffix.
The suffix is also added to the S3 location inside the data lake buckets.

---

##### `removalPolicy`<sup>Optional</sup> <a name="removalPolicy" id="aws-dsf.governance.DataLakeCatalogProps.property.removalPolicy"></a>

```typescript
public readonly removalPolicy: RemovalPolicy;
```

- *Type:* aws-cdk-lib.RemovalPolicy
- *Default:* RETAIN (The bucket will be orphaned).

Policy to apply when the bucket is removed from this stack.

*

---

### DataLakeStorageProps <a name="DataLakeStorageProps" id="aws-dsf.storage.DataLakeStorageProps"></a>

Properties for the DataLakeStorage Construct.

#### Initializer <a name="Initializer" id="aws-dsf.storage.DataLakeStorageProps.Initializer"></a>

```typescript
import { storage } from 'aws-dsf'

const dataLakeStorageProps: storage.DataLakeStorageProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.storage.DataLakeStorageProps.property.bronzeBucketArchiveDelay">bronzeBucketArchiveDelay</a></code> | <code>number</code> | Delay (in days) before archiving BRONZE data to frozen storage (Glacier storage class). |
| <code><a href="#aws-dsf.storage.DataLakeStorageProps.property.bronzeBucketInfrequentAccessDelay">bronzeBucketInfrequentAccessDelay</a></code> | <code>number</code> | Delay (in days) before moving BRONZE data to cold storage (Infrequent Access storage class). |
| <code><a href="#aws-dsf.storage.DataLakeStorageProps.property.bronzeBucketName">bronzeBucketName</a></code> | <code>string</code> | Name of the Bronze bucket. |
| <code><a href="#aws-dsf.storage.DataLakeStorageProps.property.dataLakeKey">dataLakeKey</a></code> | <code>aws-cdk-lib.aws_kms.IKey</code> | The KMS Key used to encrypt all DataLakeStorage S3 buckets. |
| <code><a href="#aws-dsf.storage.DataLakeStorageProps.property.goldBucketArchiveDelay">goldBucketArchiveDelay</a></code> | <code>number</code> | Delay (in days) before archiving GOLD data to frozen storage (Glacier storage class). |
| <code><a href="#aws-dsf.storage.DataLakeStorageProps.property.goldBucketInfrequentAccessDelay">goldBucketInfrequentAccessDelay</a></code> | <code>number</code> | Delay (in days) before moving GOLD data to cold storage (Infrequent Access storage class). |
| <code><a href="#aws-dsf.storage.DataLakeStorageProps.property.goldBucketName">goldBucketName</a></code> | <code>string</code> | Name of the Gold bucket. |
| <code><a href="#aws-dsf.storage.DataLakeStorageProps.property.removalPolicy">removalPolicy</a></code> | <code>aws-cdk-lib.RemovalPolicy</code> | The removal policy when deleting the CDK resource. |
| <code><a href="#aws-dsf.storage.DataLakeStorageProps.property.silverBucketArchiveDelay">silverBucketArchiveDelay</a></code> | <code>number</code> | Delay (in days) before archiving SILVER data to frozen storage (Glacier storage class). |
| <code><a href="#aws-dsf.storage.DataLakeStorageProps.property.silverBucketInfrequentAccessDelay">silverBucketInfrequentAccessDelay</a></code> | <code>number</code> | Delay (in days) before moving SILVER data to cold storage (Infrequent Access storage class). |
| <code><a href="#aws-dsf.storage.DataLakeStorageProps.property.silverBucketName">silverBucketName</a></code> | <code>string</code> | Name of the Silver bucket. |

---

##### `bronzeBucketArchiveDelay`<sup>Optional</sup> <a name="bronzeBucketArchiveDelay" id="aws-dsf.storage.DataLakeStorageProps.property.bronzeBucketArchiveDelay"></a>

```typescript
public readonly bronzeBucketArchiveDelay: number;
```

- *Type:* number
- *Default:* Move objects to Glacier after 90 days.

Delay (in days) before archiving BRONZE data to frozen storage (Glacier storage class).

---

##### `bronzeBucketInfrequentAccessDelay`<sup>Optional</sup> <a name="bronzeBucketInfrequentAccessDelay" id="aws-dsf.storage.DataLakeStorageProps.property.bronzeBucketInfrequentAccessDelay"></a>

```typescript
public readonly bronzeBucketInfrequentAccessDelay: number;
```

- *Type:* number
- *Default:* Move objects to Infrequent Access after 30 days.

Delay (in days) before moving BRONZE data to cold storage (Infrequent Access storage class).

---

##### `bronzeBucketName`<sup>Optional</sup> <a name="bronzeBucketName" id="aws-dsf.storage.DataLakeStorageProps.property.bronzeBucketName"></a>

```typescript
public readonly bronzeBucketName: string;
```

- *Type:* string
- *Default:* `bronze-<ACCOUNT_ID>-<REGION>-<UNIQUE_ID>` will be used.

Name of the Bronze bucket.

Use `BucketUtils.generateUniqueBucketName()` to generate a unique name (recommended).

---

##### `dataLakeKey`<sup>Optional</sup> <a name="dataLakeKey" id="aws-dsf.storage.DataLakeStorageProps.property.dataLakeKey"></a>

```typescript
public readonly dataLakeKey: IKey;
```

- *Type:* aws-cdk-lib.aws_kms.IKey
- *Default:* A single KMS customer key is created.

The KMS Key used to encrypt all DataLakeStorage S3 buckets.

---

##### `goldBucketArchiveDelay`<sup>Optional</sup> <a name="goldBucketArchiveDelay" id="aws-dsf.storage.DataLakeStorageProps.property.goldBucketArchiveDelay"></a>

```typescript
public readonly goldBucketArchiveDelay: number;
```

- *Type:* number
- *Default:* Objects are not archived to Glacier.

Delay (in days) before archiving GOLD data to frozen storage (Glacier storage class).

---

##### `goldBucketInfrequentAccessDelay`<sup>Optional</sup> <a name="goldBucketInfrequentAccessDelay" id="aws-dsf.storage.DataLakeStorageProps.property.goldBucketInfrequentAccessDelay"></a>

```typescript
public readonly goldBucketInfrequentAccessDelay: number;
```

- *Type:* number
- *Default:* Move objects to Infrequent Access after 90 days.

Delay (in days) before moving GOLD data to cold storage (Infrequent Access storage class).

---

##### `goldBucketName`<sup>Optional</sup> <a name="goldBucketName" id="aws-dsf.storage.DataLakeStorageProps.property.goldBucketName"></a>

```typescript
public readonly goldBucketName: string;
```

- *Type:* string
- *Default:* `gold-<ACCOUNT_ID>-<REGION>-<UNIQUE_ID>` will be used.

Name of the Gold bucket.

Use `BucketUtils.generateUniqueBucketName()` to generate a unique name (recommended).

---

##### `removalPolicy`<sup>Optional</sup> <a name="removalPolicy" id="aws-dsf.storage.DataLakeStorageProps.property.removalPolicy"></a>

```typescript
public readonly removalPolicy: RemovalPolicy;
```

- *Type:* aws-cdk-lib.RemovalPolicy
- *Default:* The resources are not deleted (`RemovalPolicy.RETAIN`).

The removal policy when deleting the CDK resource.

If DESTROY is selected, context value `@data-solutions-framework-on-aws/removeDataOnDestroy` needs to be set to true.
Otherwise, the removalPolicy is reverted to RETAIN.

---

##### `silverBucketArchiveDelay`<sup>Optional</sup> <a name="silverBucketArchiveDelay" id="aws-dsf.storage.DataLakeStorageProps.property.silverBucketArchiveDelay"></a>

```typescript
public readonly silverBucketArchiveDelay: number;
```

- *Type:* number
- *Default:* Objects are not archived to Glacier.

Delay (in days) before archiving SILVER data to frozen storage (Glacier storage class).

---

##### `silverBucketInfrequentAccessDelay`<sup>Optional</sup> <a name="silverBucketInfrequentAccessDelay" id="aws-dsf.storage.DataLakeStorageProps.property.silverBucketInfrequentAccessDelay"></a>

```typescript
public readonly silverBucketInfrequentAccessDelay: number;
```

- *Type:* number
- *Default:* Move objects to Infrequent Access after 90 days.

Delay (in days) before moving SILVER data to cold storage (Infrequent Access storage class).

---

##### `silverBucketName`<sup>Optional</sup> <a name="silverBucketName" id="aws-dsf.storage.DataLakeStorageProps.property.silverBucketName"></a>

```typescript
public readonly silverBucketName: string;
```

- *Type:* string
- *Default:* `silver-<ACCOUNT_ID>-<REGION>-<UNIQUE_ID>` will be used.

Name of the Silver bucket.

Use `BucketUtils.generateUniqueBucketName()` to generate a unique name (recommended).

---

### DataVpcProps <a name="DataVpcProps" id="aws-dsf.utils.DataVpcProps"></a>

The properties for the DataVpc construct.

#### Initializer <a name="Initializer" id="aws-dsf.utils.DataVpcProps.Initializer"></a>

```typescript
import { utils } from 'aws-dsf'

const dataVpcProps: utils.DataVpcProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.utils.DataVpcProps.property.vpcCidr">vpcCidr</a></code> | <code>string</code> | The CIDR to use to create the subnets in the VPC. |
| <code><a href="#aws-dsf.utils.DataVpcProps.property.flowLogKey">flowLogKey</a></code> | <code>aws-cdk-lib.aws_kms.IKey</code> | The KMS key for the VPC flow log group. |
| <code><a href="#aws-dsf.utils.DataVpcProps.property.flowLogRetention">flowLogRetention</a></code> | <code>aws-cdk-lib.aws_logs.RetentionDays</code> | The retention period to apply to VPC Flow Logs. |
| <code><a href="#aws-dsf.utils.DataVpcProps.property.flowLogRole">flowLogRole</a></code> | <code>aws-cdk-lib.aws_iam.IRole</code> | The IAM role for the VPC flow log. |
| <code><a href="#aws-dsf.utils.DataVpcProps.property.removalPolicy">removalPolicy</a></code> | <code>aws-cdk-lib.RemovalPolicy</code> | The policy to apply when the bucket is removed from this stack. |

---

##### `vpcCidr`<sup>Required</sup> <a name="vpcCidr" id="aws-dsf.utils.DataVpcProps.property.vpcCidr"></a>

```typescript
public readonly vpcCidr: string;
```

- *Type:* string

The CIDR to use to create the subnets in the VPC.

---

##### `flowLogKey`<sup>Optional</sup> <a name="flowLogKey" id="aws-dsf.utils.DataVpcProps.property.flowLogKey"></a>

```typescript
public readonly flowLogKey: IKey;
```

- *Type:* aws-cdk-lib.aws_kms.IKey
- *Default:* A new KMS key is created

The KMS key for the VPC flow log group.

The resource policy of the key must be configured according to the AWS documentation.

> [(https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/encrypt-log-data-kms.html)]((https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/encrypt-log-data-kms.html))

---

##### `flowLogRetention`<sup>Optional</sup> <a name="flowLogRetention" id="aws-dsf.utils.DataVpcProps.property.flowLogRetention"></a>

```typescript
public readonly flowLogRetention: RetentionDays;
```

- *Type:* aws-cdk-lib.aws_logs.RetentionDays
- *Default:* One week retention

The retention period to apply to VPC Flow Logs.

---

##### `flowLogRole`<sup>Optional</sup> <a name="flowLogRole" id="aws-dsf.utils.DataVpcProps.property.flowLogRole"></a>

```typescript
public readonly flowLogRole: IRole;
```

- *Type:* aws-cdk-lib.aws_iam.IRole
- *Default:* A new IAM role is created

The IAM role for the VPC flow log.

The role must be configured as described in the AWS VPC Flow Log documentation.

> [(https://docs.aws.amazon.com/vpc/latest/userguide/flow-logs-cwl.html#flow-logs-iam-role)]((https://docs.aws.amazon.com/vpc/latest/userguide/flow-logs-cwl.html#flow-logs-iam-role))

---

##### `removalPolicy`<sup>Optional</sup> <a name="removalPolicy" id="aws-dsf.utils.DataVpcProps.property.removalPolicy"></a>

```typescript
public readonly removalPolicy: RemovalPolicy;
```

- *Type:* aws-cdk-lib.RemovalPolicy
- *Default:* RETAIN The resources will not be deleted.

The policy to apply when the bucket is removed from this stack.

---

### EmrVirtualClusterProps <a name="EmrVirtualClusterProps" id="aws-dsf.processing.EmrVirtualClusterProps"></a>

The properties for the EmrVirtualCluster Construct class.

#### Initializer <a name="Initializer" id="aws-dsf.processing.EmrVirtualClusterProps.Initializer"></a>

```typescript
import { processing } from 'aws-dsf'

const emrVirtualClusterProps: processing.EmrVirtualClusterProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.processing.EmrVirtualClusterProps.property.name">name</a></code> | <code>string</code> | name of the Amazon Emr virtual cluster to be created. |
| <code><a href="#aws-dsf.processing.EmrVirtualClusterProps.property.createNamespace">createNamespace</a></code> | <code>boolean</code> | creates Amazon EKS namespace. |
| <code><a href="#aws-dsf.processing.EmrVirtualClusterProps.property.eksNamespace">eksNamespace</a></code> | <code>string</code> | name of the Amazon EKS namespace to be linked to the Amazon EMR virtual cluster. |

---

##### `name`<sup>Required</sup> <a name="name" id="aws-dsf.processing.EmrVirtualClusterProps.property.name"></a>

```typescript
public readonly name: string;
```

- *Type:* string

name of the Amazon Emr virtual cluster to be created.

---

##### `createNamespace`<sup>Optional</sup> <a name="createNamespace" id="aws-dsf.processing.EmrVirtualClusterProps.property.createNamespace"></a>

```typescript
public readonly createNamespace: boolean;
```

- *Type:* boolean
- *Default:* Do not create the namespace

creates Amazon EKS namespace.

---

##### `eksNamespace`<sup>Optional</sup> <a name="eksNamespace" id="aws-dsf.processing.EmrVirtualClusterProps.property.eksNamespace"></a>

```typescript
public readonly eksNamespace: string;
```

- *Type:* string
- *Default:* Use the default namespace

name of the Amazon EKS namespace to be linked to the Amazon EMR virtual cluster.

---

### PySparkApplicationPackageProps <a name="PySparkApplicationPackageProps" id="aws-dsf.processing.PySparkApplicationPackageProps"></a>

Properties for the {PySparkApplicationPackage} construct.

#### Initializer <a name="Initializer" id="aws-dsf.processing.PySparkApplicationPackageProps.Initializer"></a>

```typescript
import { processing } from 'aws-dsf'

const pySparkApplicationPackageProps: processing.PySparkApplicationPackageProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.processing.PySparkApplicationPackageProps.property.applicationName">applicationName</a></code> | <code>string</code> | The name of the pyspark application. |
| <code><a href="#aws-dsf.processing.PySparkApplicationPackageProps.property.entrypointPath">entrypointPath</a></code> | <code>string</code> | The source path in your code base where you have the entrypoint stored example `~/my-project/src/entrypoint.py`. |
| <code><a href="#aws-dsf.processing.PySparkApplicationPackageProps.property.artifactsBucket">artifactsBucket</a></code> | <code>aws-cdk-lib.aws_s3.IBucket</code> | The S3 bucket where to upload the artifacts of the Spark Job This is where the entry point and archive of the virtual environment will be stored. |
| <code><a href="#aws-dsf.processing.PySparkApplicationPackageProps.property.assetUploadRole">assetUploadRole</a></code> | <code>aws-cdk-lib.aws_iam.IRole</code> | When passed, the Lambda function would used this role as its execution role. |
| <code><a href="#aws-dsf.processing.PySparkApplicationPackageProps.property.dependenciesFolder">dependenciesFolder</a></code> | <code>string</code> | The source directory where you have `requirements.txt` or `pyproject.toml` that will install external AND internal Python packages. If your PySpark application has more than one Python file, you need to [package your Python project](https://packaging.python.org/en/latest/tutorials/packaging-projects/). This location must also have a `Dockerfile` that will [create a virtual environment and build an archive](https://docs.aws.amazon.com/emr/latest/EMR-Serverless-UserGuide/using-python-libraries.html#building-python-virtual-env) out of it. |
| <code><a href="#aws-dsf.processing.PySparkApplicationPackageProps.property.removalPolicy">removalPolicy</a></code> | <code>aws-cdk-lib.RemovalPolicy</code> | The removal policy when deleting the CDK resource. |
| <code><a href="#aws-dsf.processing.PySparkApplicationPackageProps.property.venvArchivePath">venvArchivePath</a></code> | <code>string</code> | The path of the Python virtual environment archive generated in the Docker container. |

---

##### `applicationName`<sup>Required</sup> <a name="applicationName" id="aws-dsf.processing.PySparkApplicationPackageProps.property.applicationName"></a>

```typescript
public readonly applicationName: string;
```

- *Type:* string

The name of the pyspark application.

This name is used as a parent directory in s3 to store the entrypoint as well as virtual environment archive

---

##### `entrypointPath`<sup>Required</sup> <a name="entrypointPath" id="aws-dsf.processing.PySparkApplicationPackageProps.property.entrypointPath"></a>

```typescript
public readonly entrypointPath: string;
```

- *Type:* string

The source path in your code base where you have the entrypoint stored example `~/my-project/src/entrypoint.py`.

---

##### `artifactsBucket`<sup>Optional</sup> <a name="artifactsBucket" id="aws-dsf.processing.PySparkApplicationPackageProps.property.artifactsBucket"></a>

```typescript
public readonly artifactsBucket: IBucket;
```

- *Type:* aws-cdk-lib.aws_s3.IBucket
- *Default:* A bucket is created

The S3 bucket where to upload the artifacts of the Spark Job This is where the entry point and archive of the virtual environment will be stored.

---

##### `assetUploadRole`<sup>Optional</sup> <a name="assetUploadRole" id="aws-dsf.processing.PySparkApplicationPackageProps.property.assetUploadRole"></a>

```typescript
public readonly assetUploadRole: IRole;
```

- *Type:* aws-cdk-lib.aws_iam.IRole
- *Default:* A new role would be created with least privilege permissions

When passed, the Lambda function would used this role as its execution role.

Additional permissions would be granted to this role such as S3 Bucket permissions.

---

##### `dependenciesFolder`<sup>Optional</sup> <a name="dependenciesFolder" id="aws-dsf.processing.PySparkApplicationPackageProps.property.dependenciesFolder"></a>

```typescript
public readonly dependenciesFolder: string;
```

- *Type:* string
- *Default:* No dependencies (internal or external) are packaged. Only the entrypoint can be used in the Spark Job.

The source directory where you have `requirements.txt` or `pyproject.toml` that will install external AND internal Python packages. If your PySpark application has more than one Python file, you need to [package your Python project](https://packaging.python.org/en/latest/tutorials/packaging-projects/). This location must also have a `Dockerfile` that will [create a virtual environment and build an archive](https://docs.aws.amazon.com/emr/latest/EMR-Serverless-UserGuide/using-python-libraries.html#building-python-virtual-env) out of it.

---

##### `removalPolicy`<sup>Optional</sup> <a name="removalPolicy" id="aws-dsf.processing.PySparkApplicationPackageProps.property.removalPolicy"></a>

```typescript
public readonly removalPolicy: RemovalPolicy;
```

- *Type:* aws-cdk-lib.RemovalPolicy
- *Default:* The resources are not deleted (`RemovalPolicy.RETAIN`).

The removal policy when deleting the CDK resource.

Resources like Amazon cloudwatch log or Amazon S3 bucket.
If DESTROY is selected, the context value '@data-solutions-framework-on-aws/removeDataOnDestroy'
in the 'cdk.json' or 'cdk.context.json' must be set to true.

---

##### `venvArchivePath`<sup>Optional</sup> <a name="venvArchivePath" id="aws-dsf.processing.PySparkApplicationPackageProps.property.venvArchivePath"></a>

```typescript
public readonly venvArchivePath: string;
```

- *Type:* string
- *Default:* No virtual environment archive is packaged. Only the entrypoint can be used in the Spark Job. It is required if the `dependenciesFolder` is provided.

The path of the Python virtual environment archive generated in the Docker container.

This is the output path used in the `venv-pack -o` command in your Dockerfile.

---

### S3DataCopyProps <a name="S3DataCopyProps" id="aws-dsf.utils.S3DataCopyProps"></a>

Properties for S3DataCopy construct.

#### Initializer <a name="Initializer" id="aws-dsf.utils.S3DataCopyProps.Initializer"></a>

```typescript
import { utils } from 'aws-dsf'

const s3DataCopyProps: utils.S3DataCopyProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.utils.S3DataCopyProps.property.sourceBucket">sourceBucket</a></code> | <code>aws-cdk-lib.aws_s3.IBucket</code> | The source bucket. |
| <code><a href="#aws-dsf.utils.S3DataCopyProps.property.sourceBucketRegion">sourceBucketRegion</a></code> | <code>string</code> | The source bucket region. |
| <code><a href="#aws-dsf.utils.S3DataCopyProps.property.targetBucket">targetBucket</a></code> | <code>aws-cdk-lib.aws_s3.IBucket</code> | the target bucket. |
| <code><a href="#aws-dsf.utils.S3DataCopyProps.property.executionRole">executionRole</a></code> | <code>aws-cdk-lib.aws_iam.IRole</code> | The IAM role to use in the custom resource for copying data. |
| <code><a href="#aws-dsf.utils.S3DataCopyProps.property.removalPolicy">removalPolicy</a></code> | <code>aws-cdk-lib.RemovalPolicy</code> | The policy to apply when the resource is removed from this stack. |
| <code><a href="#aws-dsf.utils.S3DataCopyProps.property.securityGroups">securityGroups</a></code> | <code>aws-cdk-lib.aws_ec2.ISecurityGroup[]</code> | The list of security groups to attach to the custom resource. |
| <code><a href="#aws-dsf.utils.S3DataCopyProps.property.sourceBucketPrefix">sourceBucketPrefix</a></code> | <code>string</code> | The source bucket prefix with a slash at the end. |
| <code><a href="#aws-dsf.utils.S3DataCopyProps.property.subnets">subnets</a></code> | <code>aws-cdk-lib.aws_ec2.SubnetSelection</code> | The subnets to deploy the custom resource in. |
| <code><a href="#aws-dsf.utils.S3DataCopyProps.property.targetBucketPrefix">targetBucketPrefix</a></code> | <code>string</code> | the target bucket prefix with a slash at the end. |
| <code><a href="#aws-dsf.utils.S3DataCopyProps.property.vpc">vpc</a></code> | <code>aws-cdk-lib.aws_ec2.IVpc</code> | The VPC to deploy the custom resource in. |

---

##### `sourceBucket`<sup>Required</sup> <a name="sourceBucket" id="aws-dsf.utils.S3DataCopyProps.property.sourceBucket"></a>

```typescript
public readonly sourceBucket: IBucket;
```

- *Type:* aws-cdk-lib.aws_s3.IBucket

The source bucket.

---

##### `sourceBucketRegion`<sup>Required</sup> <a name="sourceBucketRegion" id="aws-dsf.utils.S3DataCopyProps.property.sourceBucketRegion"></a>

```typescript
public readonly sourceBucketRegion: string;
```

- *Type:* string

The source bucket region.

---

##### `targetBucket`<sup>Required</sup> <a name="targetBucket" id="aws-dsf.utils.S3DataCopyProps.property.targetBucket"></a>

```typescript
public readonly targetBucket: IBucket;
```

- *Type:* aws-cdk-lib.aws_s3.IBucket

the target bucket.

---

##### `executionRole`<sup>Optional</sup> <a name="executionRole" id="aws-dsf.utils.S3DataCopyProps.property.executionRole"></a>

```typescript
public readonly executionRole: IRole;
```

- *Type:* aws-cdk-lib.aws_iam.IRole
- *Default:* A new role is created

The IAM role to use in the custom resource for copying data.

---

##### `removalPolicy`<sup>Optional</sup> <a name="removalPolicy" id="aws-dsf.utils.S3DataCopyProps.property.removalPolicy"></a>

```typescript
public readonly removalPolicy: RemovalPolicy;
```

- *Type:* aws-cdk-lib.RemovalPolicy
- *Default:* RETAIN. The resources will not be deleted.

The policy to apply when the resource is removed from this stack.

---

##### `securityGroups`<sup>Optional</sup> <a name="securityGroups" id="aws-dsf.utils.S3DataCopyProps.property.securityGroups"></a>

```typescript
public readonly securityGroups: ISecurityGroup[];
```

- *Type:* aws-cdk-lib.aws_ec2.ISecurityGroup[]
- *Default:* If `vpc` is not supplied, no security groups are attached. Otherwise, a dedicated security group is created for each function.

The list of security groups to attach to the custom resource.

---

##### `sourceBucketPrefix`<sup>Optional</sup> <a name="sourceBucketPrefix" id="aws-dsf.utils.S3DataCopyProps.property.sourceBucketPrefix"></a>

```typescript
public readonly sourceBucketPrefix: string;
```

- *Type:* string
- *Default:* No prefix is used

The source bucket prefix with a slash at the end.

---

##### `subnets`<sup>Optional</sup> <a name="subnets" id="aws-dsf.utils.S3DataCopyProps.property.subnets"></a>

```typescript
public readonly subnets: SubnetSelection;
```

- *Type:* aws-cdk-lib.aws_ec2.SubnetSelection
- *Default:* The Custom Resource is executed in VPCs owned by AWS Lambda service.

The subnets to deploy the custom resource in.

---

##### `targetBucketPrefix`<sup>Optional</sup> <a name="targetBucketPrefix" id="aws-dsf.utils.S3DataCopyProps.property.targetBucketPrefix"></a>

```typescript
public readonly targetBucketPrefix: string;
```

- *Type:* string
- *Default:* No prefix is used

the target bucket prefix with a slash at the end.

---

##### `vpc`<sup>Optional</sup> <a name="vpc" id="aws-dsf.utils.S3DataCopyProps.property.vpc"></a>

```typescript
public readonly vpc: IVpc;
```

- *Type:* aws-cdk-lib.aws_ec2.IVpc
- *Default:* The Custom Resource is executed in VPCs owned by AWS Lambda service.

The VPC to deploy the custom resource in.

---

### SparkEmrCICDPipelineProps <a name="SparkEmrCICDPipelineProps" id="aws-dsf.processing.SparkEmrCICDPipelineProps"></a>

Properties for SparkEmrCICDPipeline class.

#### Initializer <a name="Initializer" id="aws-dsf.processing.SparkEmrCICDPipelineProps.Initializer"></a>

```typescript
import { processing } from 'aws-dsf'

const sparkEmrCICDPipelineProps: processing.SparkEmrCICDPipelineProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.processing.SparkEmrCICDPipelineProps.property.applicationStackFactory">applicationStackFactory</a></code> | <code>aws-dsf.utils.ApplicationStackFactory</code> | The application Stack to deploy in the different CDK Pipelines Stages. |
| <code><a href="#aws-dsf.processing.SparkEmrCICDPipelineProps.property.sparkApplicationName">sparkApplicationName</a></code> | <code>string</code> | The name of the Spark application to be deployed. |
| <code><a href="#aws-dsf.processing.SparkEmrCICDPipelineProps.property.cdkApplicationPath">cdkApplicationPath</a></code> | <code>string</code> | The path to the folder that contains the CDK Application. |
| <code><a href="#aws-dsf.processing.SparkEmrCICDPipelineProps.property.integTestEnv">integTestEnv</a></code> | <code>{[ key: string ]: string}</code> | The environment variables to create from the Application Stack and to pass to the integration tests. |
| <code><a href="#aws-dsf.processing.SparkEmrCICDPipelineProps.property.integTestPermissions">integTestPermissions</a></code> | <code>aws-cdk-lib.aws_iam.PolicyStatement[]</code> | The IAM policy statements to add permissions for running the integration tests. |
| <code><a href="#aws-dsf.processing.SparkEmrCICDPipelineProps.property.integTestScript">integTestScript</a></code> | <code>string</code> | The path to the Shell script that contains integration tests. |
| <code><a href="#aws-dsf.processing.SparkEmrCICDPipelineProps.property.removalPolicy">removalPolicy</a></code> | <code>aws-cdk-lib.RemovalPolicy</code> | The removal policy when deleting the CDK resource. |
| <code><a href="#aws-dsf.processing.SparkEmrCICDPipelineProps.property.sparkApplicationPath">sparkApplicationPath</a></code> | <code>string</code> | The path to the folder that contains the Spark Application. |
| <code><a href="#aws-dsf.processing.SparkEmrCICDPipelineProps.property.sparkImage">sparkImage</a></code> | <code>aws-dsf.processing.SparkImage</code> | The EMR Spark image to use to run the unit tests. |

---

##### `applicationStackFactory`<sup>Required</sup> <a name="applicationStackFactory" id="aws-dsf.processing.SparkEmrCICDPipelineProps.property.applicationStackFactory"></a>

```typescript
public readonly applicationStackFactory: ApplicationStackFactory;
```

- *Type:* aws-dsf.utils.ApplicationStackFactory

The application Stack to deploy in the different CDK Pipelines Stages.

---

##### `sparkApplicationName`<sup>Required</sup> <a name="sparkApplicationName" id="aws-dsf.processing.SparkEmrCICDPipelineProps.property.sparkApplicationName"></a>

```typescript
public readonly sparkApplicationName: string;
```

- *Type:* string

The name of the Spark application to be deployed.

---

##### `cdkApplicationPath`<sup>Optional</sup> <a name="cdkApplicationPath" id="aws-dsf.processing.SparkEmrCICDPipelineProps.property.cdkApplicationPath"></a>

```typescript
public readonly cdkApplicationPath: string;
```

- *Type:* string
- *Default:* The root of the repository

The path to the folder that contains the CDK Application.

---

##### `integTestEnv`<sup>Optional</sup> <a name="integTestEnv" id="aws-dsf.processing.SparkEmrCICDPipelineProps.property.integTestEnv"></a>

```typescript
public readonly integTestEnv: {[ key: string ]: string};
```

- *Type:* {[ key: string ]: string}
- *Default:* No environment variables

The environment variables to create from the Application Stack and to pass to the integration tests.

This is used to interact with resources created by the Application Stack from within the integration tests script.
Key is the name of the environment variable to create. Value is generally a CfnOutput name from the Application Stack.

---

##### `integTestPermissions`<sup>Optional</sup> <a name="integTestPermissions" id="aws-dsf.processing.SparkEmrCICDPipelineProps.property.integTestPermissions"></a>

```typescript
public readonly integTestPermissions: PolicyStatement[];
```

- *Type:* aws-cdk-lib.aws_iam.PolicyStatement[]
- *Default:* No permissions

The IAM policy statements to add permissions for running the integration tests.

---

##### `integTestScript`<sup>Optional</sup> <a name="integTestScript" id="aws-dsf.processing.SparkEmrCICDPipelineProps.property.integTestScript"></a>

```typescript
public readonly integTestScript: string;
```

- *Type:* string
- *Default:* No integration tests are run

The path to the Shell script that contains integration tests.

---

##### `removalPolicy`<sup>Optional</sup> <a name="removalPolicy" id="aws-dsf.processing.SparkEmrCICDPipelineProps.property.removalPolicy"></a>

```typescript
public readonly removalPolicy: RemovalPolicy;
```

- *Type:* aws-cdk-lib.RemovalPolicy
- *Default:* The resources are not deleted (`RemovalPolicy.RETAIN`).

The removal policy when deleting the CDK resource.

If DESTROY is selected, context value `@data-solutions-framework-on-aws/removeDataOnDestroy` needs to be set to true.
Otherwise the removalPolicy is reverted to RETAIN.

---

##### `sparkApplicationPath`<sup>Optional</sup> <a name="sparkApplicationPath" id="aws-dsf.processing.SparkEmrCICDPipelineProps.property.sparkApplicationPath"></a>

```typescript
public readonly sparkApplicationPath: string;
```

- *Type:* string
- *Default:* The root of the repository

The path to the folder that contains the Spark Application.

---

##### `sparkImage`<sup>Optional</sup> <a name="sparkImage" id="aws-dsf.processing.SparkEmrCICDPipelineProps.property.sparkImage"></a>

```typescript
public readonly sparkImage: SparkImage;
```

- *Type:* aws-dsf.processing.SparkImage
- *Default:* EMR v6.12 is used

The EMR Spark image to use to run the unit tests.

---

### SparkEmrContainersRuntimeProps <a name="SparkEmrContainersRuntimeProps" id="aws-dsf.processing.SparkEmrContainersRuntimeProps"></a>

The properties for the EmrEksCluster Construct class.

#### Initializer <a name="Initializer" id="aws-dsf.processing.SparkEmrContainersRuntimeProps.Initializer"></a>

```typescript
import { processing } from 'aws-dsf'

const sparkEmrContainersRuntimeProps: processing.SparkEmrContainersRuntimeProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntimeProps.property.kubectlLambdaLayer">kubectlLambdaLayer</a></code> | <code>aws-cdk-lib.aws_lambda.ILayerVersion</code> | Starting k8s 1.22, CDK no longer bundle the kubectl layer with the code due to breaking npm package size. A layer needs to be passed to the Construct. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntimeProps.property.publicAccessCIDRs">publicAccessCIDRs</a></code> | <code>string[]</code> | The CIDR blocks that are allowed access to your cluster’s public Kubernetes API server endpoint. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntimeProps.property.createEmrOnEksServiceLinkedRole">createEmrOnEksServiceLinkedRole</a></code> | <code>boolean</code> | Wether we need to create an EMR on EKS Service Linked Role. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntimeProps.property.defaultNodes">defaultNodes</a></code> | <code>boolean</code> | If set to true, the Construct will create default EKS nodegroups or node provisioners (based on the autoscaler mechanism used). |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntimeProps.property.ec2InstanceRole">ec2InstanceRole</a></code> | <code>aws-cdk-lib.aws_iam.IRole</code> | The role used for the cluster nodes instance profile. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntimeProps.property.eksAdminRole">eksAdminRole</a></code> | <code>aws-cdk-lib.aws_iam.IRole</code> | Amazon IAM Role to be added to Amazon EKS master roles that will give access to kubernetes cluster from AWS console UI. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntimeProps.property.eksCluster">eksCluster</a></code> | <code>aws-cdk-lib.aws_eks.Cluster</code> | The EKS cluster to setup EMR on. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntimeProps.property.eksClusterName">eksClusterName</a></code> | <code>string</code> | Name of the Amazon EKS cluster to be created. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntimeProps.property.eksVpc">eksVpc</a></code> | <code>aws-cdk-lib.aws_ec2.IVpc</code> | The VPC to use when creating the EKS cluster. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntimeProps.property.karpenterVersion">karpenterVersion</a></code> | <code>aws-dsf.processing.KarpenterVersion</code> | The version of karpenter to pass to Helm. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntimeProps.property.kubernetesVersion">kubernetesVersion</a></code> | <code>aws-cdk-lib.aws_eks.KubernetesVersion</code> | Kubernetes version for Amazon EKS cluster that will be created The default is changed as new version version of k8s on EKS becomes available. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntimeProps.property.removalPolicy">removalPolicy</a></code> | <code>aws-cdk-lib.RemovalPolicy</code> | The removal policy when deleting the CDK resource. |
| <code><a href="#aws-dsf.processing.SparkEmrContainersRuntimeProps.property.vpcCidr">vpcCidr</a></code> | <code>string</code> | The CIDR of the VPC to use when creating the EKS cluster. |

---

##### `kubectlLambdaLayer`<sup>Required</sup> <a name="kubectlLambdaLayer" id="aws-dsf.processing.SparkEmrContainersRuntimeProps.property.kubectlLambdaLayer"></a>

```typescript
public readonly kubectlLambdaLayer: ILayerVersion;
```

- *Type:* aws-cdk-lib.aws_lambda.ILayerVersion

Starting k8s 1.22, CDK no longer bundle the kubectl layer with the code due to breaking npm package size. A layer needs to be passed to the Construct.

The cdk [documentation](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_eks.KubernetesVersion.html#static-v1_22)
contains the libraries that you should add for the right Kubernetes version

---

##### `publicAccessCIDRs`<sup>Required</sup> <a name="publicAccessCIDRs" id="aws-dsf.processing.SparkEmrContainersRuntimeProps.property.publicAccessCIDRs"></a>

```typescript
public readonly publicAccessCIDRs: string[];
```

- *Type:* string[]

The CIDR blocks that are allowed access to your cluster’s public Kubernetes API server endpoint.

---

##### `createEmrOnEksServiceLinkedRole`<sup>Optional</sup> <a name="createEmrOnEksServiceLinkedRole" id="aws-dsf.processing.SparkEmrContainersRuntimeProps.property.createEmrOnEksServiceLinkedRole"></a>

```typescript
public readonly createEmrOnEksServiceLinkedRole: boolean;
```

- *Type:* boolean
- *Default:* true

Wether we need to create an EMR on EKS Service Linked Role.

---

##### `defaultNodes`<sup>Optional</sup> <a name="defaultNodes" id="aws-dsf.processing.SparkEmrContainersRuntimeProps.property.defaultNodes"></a>

```typescript
public readonly defaultNodes: boolean;
```

- *Type:* boolean
- *Default:* true

If set to true, the Construct will create default EKS nodegroups or node provisioners (based on the autoscaler mechanism used).

There are three types of nodes:
 * Nodes for critical jobs which use on-demand instances, high speed disks and workload isolation
 * Nodes for shared worklaods which uses spot instances and no isolation to optimize costs
 * Nodes for notebooks which leverage a cost optimized configuration for running EMR managed endpoints and spark drivers/executors.

---

##### `ec2InstanceRole`<sup>Optional</sup> <a name="ec2InstanceRole" id="aws-dsf.processing.SparkEmrContainersRuntimeProps.property.ec2InstanceRole"></a>

```typescript
public readonly ec2InstanceRole: IRole;
```

- *Type:* aws-cdk-lib.aws_iam.IRole
- *Default:* A role is created with AmazonEKSWorkerNodePolicy, AmazonEC2ContainerRegistryReadOnly, AmazonSSMManagedInstanceCore and AmazonEKS_CNI_Policy AWS managed policies

The role used for the cluster nodes instance profile.

---

##### `eksAdminRole`<sup>Optional</sup> <a name="eksAdminRole" id="aws-dsf.processing.SparkEmrContainersRuntimeProps.property.eksAdminRole"></a>

```typescript
public readonly eksAdminRole: IRole;
```

- *Type:* aws-cdk-lib.aws_iam.IRole

Amazon IAM Role to be added to Amazon EKS master roles that will give access to kubernetes cluster from AWS console UI.

An admin role must be passed if `eksCluster` property is not set.
You will use this role to manage the EKS cluster and grant other access to it.

---

##### `eksCluster`<sup>Optional</sup> <a name="eksCluster" id="aws-dsf.processing.SparkEmrContainersRuntimeProps.property.eksCluster"></a>

```typescript
public readonly eksCluster: Cluster;
```

- *Type:* aws-cdk-lib.aws_eks.Cluster
- *Default:* An EKS Cluster is created

The EKS cluster to setup EMR on.

The cluster needs to be created in the same CDK Stack.
If the EKS cluster is provided, the cluster AddOns and all the controllers (ALB Ingress controller, Cluster Autoscaler or Karpenter...) need to be configured.
When providing an EKS cluster, the methods for adding nodegroups can still be used. They implement the best practices for running Spark on EKS.

---

##### `eksClusterName`<sup>Optional</sup> <a name="eksClusterName" id="aws-dsf.processing.SparkEmrContainersRuntimeProps.property.eksClusterName"></a>

```typescript
public readonly eksClusterName: string;
```

- *Type:* string
- *Default:* The [default cluster name]{@link DEFAULT_CLUSTER_NAME }

Name of the Amazon EKS cluster to be created.

---

##### `eksVpc`<sup>Optional</sup> <a name="eksVpc" id="aws-dsf.processing.SparkEmrContainersRuntimeProps.property.eksVpc"></a>

```typescript
public readonly eksVpc: IVpc;
```

- *Type:* aws-cdk-lib.aws_ec2.IVpc

The VPC to use when creating the EKS cluster.

VPC should have at least two private and public subnets in different Availability Zones.
All private subnets should have the following tags:
 * 'for-use-with-amazon-emr-managed-policies'='true'
 * 'kubernetes.io/role/internal-elb'='1'
All public subnets should have the following tag:
 * 'kubernetes.io/role/elb'='1'
Cannot be combined with `vpcCidr`. If combined, `vpcCidr` takes precedence.

---

##### `karpenterVersion`<sup>Optional</sup> <a name="karpenterVersion" id="aws-dsf.processing.SparkEmrContainersRuntimeProps.property.karpenterVersion"></a>

```typescript
public readonly karpenterVersion: KarpenterVersion;
```

- *Type:* aws-dsf.processing.KarpenterVersion
- *Default:* The [default Karpenter version]{@link DEFAULT_KARPENTER_VERSION }

The version of karpenter to pass to Helm.

---

##### `kubernetesVersion`<sup>Optional</sup> <a name="kubernetesVersion" id="aws-dsf.processing.SparkEmrContainersRuntimeProps.property.kubernetesVersion"></a>

```typescript
public readonly kubernetesVersion: KubernetesVersion;
```

- *Type:* aws-cdk-lib.aws_eks.KubernetesVersion
- *Default:* Kubernetes version {@link DEFAULT_EKS_VERSION }

Kubernetes version for Amazon EKS cluster that will be created The default is changed as new version version of k8s on EKS becomes available.

---

##### `removalPolicy`<sup>Optional</sup> <a name="removalPolicy" id="aws-dsf.processing.SparkEmrContainersRuntimeProps.property.removalPolicy"></a>

```typescript
public readonly removalPolicy: RemovalPolicy;
```

- *Type:* aws-cdk-lib.RemovalPolicy
- *Default:* The resources are not deleted (`RemovalPolicy.RETAIN`).

The removal policy when deleting the CDK resource.

Resources like Amazon cloudwatch log or Amazon S3 bucket
If DESTROY is selected, context value

---

##### `vpcCidr`<sup>Optional</sup> <a name="vpcCidr" id="aws-dsf.processing.SparkEmrContainersRuntimeProps.property.vpcCidr"></a>

```typescript
public readonly vpcCidr: string;
```

- *Type:* string
- *Default:* A vpc with the following CIDR 10.0.0.0/16 will be used

The CIDR of the VPC to use when creating the EKS cluster.

If provided, a VPC with three public subnets and three private subnets is created.
The size of the private subnets is four time the one of the public subnet.

---

### SparkEmrEksJobApiProps <a name="SparkEmrEksJobApiProps" id="aws-dsf.processing.SparkEmrEksJobApiProps"></a>

Configuration for the EMR on EKS job.

Use this interface when EmrOnEksSparkJobProps doesn't give you access to the configuration parameters you need.

> [[https://docs.aws.amazon.com/emr-on-eks/latest/APIReference/API_StartJobRun.html]]([https://docs.aws.amazon.com/emr-on-eks/latest/APIReference/API_StartJobRun.html])

#### Initializer <a name="Initializer" id="aws-dsf.processing.SparkEmrEksJobApiProps.Initializer"></a>

```typescript
import { processing } from 'aws-dsf'

const sparkEmrEksJobApiProps: processing.SparkEmrEksJobApiProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.processing.SparkEmrEksJobApiProps.property.removalPolicy">removalPolicy</a></code> | <code>aws-cdk-lib.RemovalPolicy</code> | The removal policy when deleting the CDK resource. |
| <code><a href="#aws-dsf.processing.SparkEmrEksJobApiProps.property.schedule">schedule</a></code> | <code>aws-cdk-lib.aws_events.Schedule</code> | Schedule to run the Step Functions state machine. |
| <code><a href="#aws-dsf.processing.SparkEmrEksJobApiProps.property.jobConfig">jobConfig</a></code> | <code>{[ key: string ]: any}</code> | EMR on EKS Job Configuration. |
| <code><a href="#aws-dsf.processing.SparkEmrEksJobApiProps.property.executionTimeoutMinutes">executionTimeoutMinutes</a></code> | <code>number</code> | Job execution timeout in minutes. |

---

##### `removalPolicy`<sup>Optional</sup> <a name="removalPolicy" id="aws-dsf.processing.SparkEmrEksJobApiProps.property.removalPolicy"></a>

```typescript
public readonly removalPolicy: RemovalPolicy;
```

- *Type:* aws-cdk-lib.RemovalPolicy
- *Default:* The resources are not deleted (`RemovalPolicy.RETAIN`).

The removal policy when deleting the CDK resource.

If DESTROY is selected, context value `@data-solutions-framework-on-aws/removeDataOnDestroy` needs to be set to true.
Otherwise the removalPolicy is reverted to RETAIN.

---

##### `schedule`<sup>Optional</sup> <a name="schedule" id="aws-dsf.processing.SparkEmrEksJobApiProps.property.schedule"></a>

```typescript
public readonly schedule: Schedule;
```

- *Type:* aws-cdk-lib.aws_events.Schedule

Schedule to run the Step Functions state machine.

> [Schedule](Schedule)

> [[https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_events.Schedule.html]]([https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_events.Schedule.html])

---

##### `jobConfig`<sup>Required</sup> <a name="jobConfig" id="aws-dsf.processing.SparkEmrEksJobApiProps.property.jobConfig"></a>

```typescript
public readonly jobConfig: {[ key: string ]: any};
```

- *Type:* {[ key: string ]: any}

EMR on EKS Job Configuration.

> [[https://docs.aws.amazon.com/emr-on-eks/latest/APIReference/API_StartJobRun.html]]([https://docs.aws.amazon.com/emr-on-eks/latest/APIReference/API_StartJobRun.html])

---

##### `executionTimeoutMinutes`<sup>Optional</sup> <a name="executionTimeoutMinutes" id="aws-dsf.processing.SparkEmrEksJobApiProps.property.executionTimeoutMinutes"></a>

```typescript
public readonly executionTimeoutMinutes: number;
```

- *Type:* number
- *Default:* 30

Job execution timeout in minutes.

---

### SparkEmrEksJobProps <a name="SparkEmrEksJobProps" id="aws-dsf.processing.SparkEmrEksJobProps"></a>

Simplified configuration for the EMR Serverless Job.

> [(https://docs.aws.amazon.com/emr-on-eks/latest/APIReference/API_StartJobRun.html#emroneks-StartJobRun-request-tags)]((https://docs.aws.amazon.com/emr-on-eks/latest/APIReference/API_StartJobRun.html#emroneks-StartJobRun-request-tags))

#### Initializer <a name="Initializer" id="aws-dsf.processing.SparkEmrEksJobProps.Initializer"></a>

```typescript
import { processing } from 'aws-dsf'

const sparkEmrEksJobProps: processing.SparkEmrEksJobProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.processing.SparkEmrEksJobProps.property.removalPolicy">removalPolicy</a></code> | <code>aws-cdk-lib.RemovalPolicy</code> | The removal policy when deleting the CDK resource. |
| <code><a href="#aws-dsf.processing.SparkEmrEksJobProps.property.schedule">schedule</a></code> | <code>aws-cdk-lib.aws_events.Schedule</code> | Schedule to run the Step Functions state machine. |
| <code><a href="#aws-dsf.processing.SparkEmrEksJobProps.property.executionRoleArn">executionRoleArn</a></code> | <code>string</code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkEmrEksJobProps.property.name">name</a></code> | <code>string</code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkEmrEksJobProps.property.sparkSubmitEntryPoint">sparkSubmitEntryPoint</a></code> | <code>string</code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkEmrEksJobProps.property.virtualClusterId">virtualClusterId</a></code> | <code>string</code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkEmrEksJobProps.property.applicationConfiguration">applicationConfiguration</a></code> | <code>{[ key: string ]: any}</code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkEmrEksJobProps.property.cloudWatchLogGroupName">cloudWatchLogGroupName</a></code> | <code>string</code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkEmrEksJobProps.property.cloudWatchLogGroupStreamPrefix">cloudWatchLogGroupStreamPrefix</a></code> | <code>string</code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkEmrEksJobProps.property.executionTimeoutMinutes">executionTimeoutMinutes</a></code> | <code>number</code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkEmrEksJobProps.property.maxRetries">maxRetries</a></code> | <code>number</code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkEmrEksJobProps.property.releaseLabel">releaseLabel</a></code> | <code>string</code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkEmrEksJobProps.property.s3LogUri">s3LogUri</a></code> | <code>string</code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkEmrEksJobProps.property.sparkSubmitEntryPointArguments">sparkSubmitEntryPointArguments</a></code> | <code>string[]</code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkEmrEksJobProps.property.sparkSubmitParameters">sparkSubmitParameters</a></code> | <code>string</code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkEmrEksJobProps.property.tags">tags</a></code> | <code>{[ key: string ]: any}</code> | *No description.* |

---

##### `removalPolicy`<sup>Optional</sup> <a name="removalPolicy" id="aws-dsf.processing.SparkEmrEksJobProps.property.removalPolicy"></a>

```typescript
public readonly removalPolicy: RemovalPolicy;
```

- *Type:* aws-cdk-lib.RemovalPolicy
- *Default:* The resources are not deleted (`RemovalPolicy.RETAIN`).

The removal policy when deleting the CDK resource.

If DESTROY is selected, context value `@data-solutions-framework-on-aws/removeDataOnDestroy` needs to be set to true.
Otherwise the removalPolicy is reverted to RETAIN.

---

##### `schedule`<sup>Optional</sup> <a name="schedule" id="aws-dsf.processing.SparkEmrEksJobProps.property.schedule"></a>

```typescript
public readonly schedule: Schedule;
```

- *Type:* aws-cdk-lib.aws_events.Schedule

Schedule to run the Step Functions state machine.

> [Schedule](Schedule)

> [[https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_events.Schedule.html]]([https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_events.Schedule.html])

---

##### `executionRoleArn`<sup>Required</sup> <a name="executionRoleArn" id="aws-dsf.processing.SparkEmrEksJobProps.property.executionRoleArn"></a>

```typescript
public readonly executionRoleArn: string;
```

- *Type:* string

---

##### `name`<sup>Required</sup> <a name="name" id="aws-dsf.processing.SparkEmrEksJobProps.property.name"></a>

```typescript
public readonly name: string;
```

- *Type:* string

---

##### `sparkSubmitEntryPoint`<sup>Required</sup> <a name="sparkSubmitEntryPoint" id="aws-dsf.processing.SparkEmrEksJobProps.property.sparkSubmitEntryPoint"></a>

```typescript
public readonly sparkSubmitEntryPoint: string;
```

- *Type:* string

---

##### `virtualClusterId`<sup>Required</sup> <a name="virtualClusterId" id="aws-dsf.processing.SparkEmrEksJobProps.property.virtualClusterId"></a>

```typescript
public readonly virtualClusterId: string;
```

- *Type:* string

---

##### `applicationConfiguration`<sup>Optional</sup> <a name="applicationConfiguration" id="aws-dsf.processing.SparkEmrEksJobProps.property.applicationConfiguration"></a>

```typescript
public readonly applicationConfiguration: {[ key: string ]: any};
```

- *Type:* {[ key: string ]: any}

---

##### `cloudWatchLogGroupName`<sup>Optional</sup> <a name="cloudWatchLogGroupName" id="aws-dsf.processing.SparkEmrEksJobProps.property.cloudWatchLogGroupName"></a>

```typescript
public readonly cloudWatchLogGroupName: string;
```

- *Type:* string

---

##### `cloudWatchLogGroupStreamPrefix`<sup>Optional</sup> <a name="cloudWatchLogGroupStreamPrefix" id="aws-dsf.processing.SparkEmrEksJobProps.property.cloudWatchLogGroupStreamPrefix"></a>

```typescript
public readonly cloudWatchLogGroupStreamPrefix: string;
```

- *Type:* string

---

##### `executionTimeoutMinutes`<sup>Optional</sup> <a name="executionTimeoutMinutes" id="aws-dsf.processing.SparkEmrEksJobProps.property.executionTimeoutMinutes"></a>

```typescript
public readonly executionTimeoutMinutes: number;
```

- *Type:* number

---

##### `maxRetries`<sup>Optional</sup> <a name="maxRetries" id="aws-dsf.processing.SparkEmrEksJobProps.property.maxRetries"></a>

```typescript
public readonly maxRetries: number;
```

- *Type:* number

---

##### `releaseLabel`<sup>Optional</sup> <a name="releaseLabel" id="aws-dsf.processing.SparkEmrEksJobProps.property.releaseLabel"></a>

```typescript
public readonly releaseLabel: string;
```

- *Type:* string

---

##### `s3LogUri`<sup>Optional</sup> <a name="s3LogUri" id="aws-dsf.processing.SparkEmrEksJobProps.property.s3LogUri"></a>

```typescript
public readonly s3LogUri: string;
```

- *Type:* string

---

##### `sparkSubmitEntryPointArguments`<sup>Optional</sup> <a name="sparkSubmitEntryPointArguments" id="aws-dsf.processing.SparkEmrEksJobProps.property.sparkSubmitEntryPointArguments"></a>

```typescript
public readonly sparkSubmitEntryPointArguments: string[];
```

- *Type:* string[]

---

##### `sparkSubmitParameters`<sup>Optional</sup> <a name="sparkSubmitParameters" id="aws-dsf.processing.SparkEmrEksJobProps.property.sparkSubmitParameters"></a>

```typescript
public readonly sparkSubmitParameters: string;
```

- *Type:* string

---

##### `tags`<sup>Optional</sup> <a name="tags" id="aws-dsf.processing.SparkEmrEksJobProps.property.tags"></a>

```typescript
public readonly tags: {[ key: string ]: any};
```

- *Type:* {[ key: string ]: any}

---

### SparkEmrServerlessJobApiProps <a name="SparkEmrServerlessJobApiProps" id="aws-dsf.processing.SparkEmrServerlessJobApiProps"></a>

Configuration for the EMR Serverless Job API.

Use this interface when EmrServerlessJobProps doesn't give you access to the configuration parameters you need.

> [[https://docs.aws.amazon.com/emr-serverless/latest/APIReference/API_StartJobRun.html]]([https://docs.aws.amazon.com/emr-serverless/latest/APIReference/API_StartJobRun.html])

#### Initializer <a name="Initializer" id="aws-dsf.processing.SparkEmrServerlessJobApiProps.Initializer"></a>

```typescript
import { processing } from 'aws-dsf'

const sparkEmrServerlessJobApiProps: processing.SparkEmrServerlessJobApiProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessJobApiProps.property.removalPolicy">removalPolicy</a></code> | <code>aws-cdk-lib.RemovalPolicy</code> | The removal policy when deleting the CDK resource. |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessJobApiProps.property.schedule">schedule</a></code> | <code>aws-cdk-lib.aws_events.Schedule</code> | Schedule to run the Step Functions state machine. |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessJobApiProps.property.jobConfig">jobConfig</a></code> | <code>{[ key: string ]: any}</code> | EMR Serverless Job Configuration. |

---

##### `removalPolicy`<sup>Optional</sup> <a name="removalPolicy" id="aws-dsf.processing.SparkEmrServerlessJobApiProps.property.removalPolicy"></a>

```typescript
public readonly removalPolicy: RemovalPolicy;
```

- *Type:* aws-cdk-lib.RemovalPolicy
- *Default:* The resources are not deleted (`RemovalPolicy.RETAIN`).

The removal policy when deleting the CDK resource.

If DESTROY is selected, context value `@data-solutions-framework-on-aws/removeDataOnDestroy` needs to be set to true.
Otherwise the removalPolicy is reverted to RETAIN.

---

##### `schedule`<sup>Optional</sup> <a name="schedule" id="aws-dsf.processing.SparkEmrServerlessJobApiProps.property.schedule"></a>

```typescript
public readonly schedule: Schedule;
```

- *Type:* aws-cdk-lib.aws_events.Schedule

Schedule to run the Step Functions state machine.

> [Schedule](Schedule)

> [[https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_events.Schedule.html]]([https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_events.Schedule.html])

---

##### `jobConfig`<sup>Required</sup> <a name="jobConfig" id="aws-dsf.processing.SparkEmrServerlessJobApiProps.property.jobConfig"></a>

```typescript
public readonly jobConfig: {[ key: string ]: any};
```

- *Type:* {[ key: string ]: any}

EMR Serverless Job Configuration.

> [[https://docs.aws.amazon.com/emr-serverless/latest/APIReference/API_StartJobRun.html]]([https://docs.aws.amazon.com/emr-serverless/latest/APIReference/API_StartJobRun.html])

---

### SparkEmrServerlessJobProps <a name="SparkEmrServerlessJobProps" id="aws-dsf.processing.SparkEmrServerlessJobProps"></a>

#### Initializer <a name="Initializer" id="aws-dsf.processing.SparkEmrServerlessJobProps.Initializer"></a>

```typescript
import { processing } from 'aws-dsf'

const sparkEmrServerlessJobProps: processing.SparkEmrServerlessJobProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessJobProps.property.removalPolicy">removalPolicy</a></code> | <code>aws-cdk-lib.RemovalPolicy</code> | The removal policy when deleting the CDK resource. |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessJobProps.property.schedule">schedule</a></code> | <code>aws-cdk-lib.aws_events.Schedule</code> | Schedule to run the Step Functions state machine. |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessJobProps.property.applicationId">applicationId</a></code> | <code>string</code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessJobProps.property.name">name</a></code> | <code>string</code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessJobProps.property.sparkSubmitEntryPoint">sparkSubmitEntryPoint</a></code> | <code>string</code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessJobProps.property.applicationConfiguration">applicationConfiguration</a></code> | <code>{[ key: string ]: any}</code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessJobProps.property.cloudWatchEncryptionKeyArn">cloudWatchEncryptionKeyArn</a></code> | <code>string</code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessJobProps.property.cloudWatchLogGroupName">cloudWatchLogGroupName</a></code> | <code>string</code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessJobProps.property.cloudWatchLogGroupStreamPrefix">cloudWatchLogGroupStreamPrefix</a></code> | <code>string</code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessJobProps.property.cloudWatchLogtypes">cloudWatchLogtypes</a></code> | <code>string</code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessJobProps.property.executionRoleArn">executionRoleArn</a></code> | <code>string</code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessJobProps.property.executionTimeoutMinutes">executionTimeoutMinutes</a></code> | <code>number</code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessJobProps.property.persistentAppUi">persistentAppUi</a></code> | <code>boolean</code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessJobProps.property.persistentAppUIKeyArn">persistentAppUIKeyArn</a></code> | <code>string</code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessJobProps.property.s3LogUri">s3LogUri</a></code> | <code>string</code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessJobProps.property.s3LogUriKeyArn">s3LogUriKeyArn</a></code> | <code>string</code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessJobProps.property.sparkSubmitEntryPointArguments">sparkSubmitEntryPointArguments</a></code> | <code>string[]</code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessJobProps.property.sparkSubmitParameters">sparkSubmitParameters</a></code> | <code>string</code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessJobProps.property.tags">tags</a></code> | <code>{[ key: string ]: any}</code> | *No description.* |

---

##### `removalPolicy`<sup>Optional</sup> <a name="removalPolicy" id="aws-dsf.processing.SparkEmrServerlessJobProps.property.removalPolicy"></a>

```typescript
public readonly removalPolicy: RemovalPolicy;
```

- *Type:* aws-cdk-lib.RemovalPolicy
- *Default:* The resources are not deleted (`RemovalPolicy.RETAIN`).

The removal policy when deleting the CDK resource.

If DESTROY is selected, context value `@data-solutions-framework-on-aws/removeDataOnDestroy` needs to be set to true.
Otherwise the removalPolicy is reverted to RETAIN.

---

##### `schedule`<sup>Optional</sup> <a name="schedule" id="aws-dsf.processing.SparkEmrServerlessJobProps.property.schedule"></a>

```typescript
public readonly schedule: Schedule;
```

- *Type:* aws-cdk-lib.aws_events.Schedule

Schedule to run the Step Functions state machine.

> [Schedule](Schedule)

> [[https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_events.Schedule.html]]([https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_events.Schedule.html])

---

##### `applicationId`<sup>Required</sup> <a name="applicationId" id="aws-dsf.processing.SparkEmrServerlessJobProps.property.applicationId"></a>

```typescript
public readonly applicationId: string;
```

- *Type:* string

---

##### `name`<sup>Required</sup> <a name="name" id="aws-dsf.processing.SparkEmrServerlessJobProps.property.name"></a>

```typescript
public readonly name: string;
```

- *Type:* string

---

##### `sparkSubmitEntryPoint`<sup>Required</sup> <a name="sparkSubmitEntryPoint" id="aws-dsf.processing.SparkEmrServerlessJobProps.property.sparkSubmitEntryPoint"></a>

```typescript
public readonly sparkSubmitEntryPoint: string;
```

- *Type:* string

---

##### `applicationConfiguration`<sup>Optional</sup> <a name="applicationConfiguration" id="aws-dsf.processing.SparkEmrServerlessJobProps.property.applicationConfiguration"></a>

```typescript
public readonly applicationConfiguration: {[ key: string ]: any};
```

- *Type:* {[ key: string ]: any}

---

##### `cloudWatchEncryptionKeyArn`<sup>Optional</sup> <a name="cloudWatchEncryptionKeyArn" id="aws-dsf.processing.SparkEmrServerlessJobProps.property.cloudWatchEncryptionKeyArn"></a>

```typescript
public readonly cloudWatchEncryptionKeyArn: string;
```

- *Type:* string

---

##### `cloudWatchLogGroupName`<sup>Optional</sup> <a name="cloudWatchLogGroupName" id="aws-dsf.processing.SparkEmrServerlessJobProps.property.cloudWatchLogGroupName"></a>

```typescript
public readonly cloudWatchLogGroupName: string;
```

- *Type:* string

---

##### `cloudWatchLogGroupStreamPrefix`<sup>Optional</sup> <a name="cloudWatchLogGroupStreamPrefix" id="aws-dsf.processing.SparkEmrServerlessJobProps.property.cloudWatchLogGroupStreamPrefix"></a>

```typescript
public readonly cloudWatchLogGroupStreamPrefix: string;
```

- *Type:* string

---

##### `cloudWatchLogtypes`<sup>Optional</sup> <a name="cloudWatchLogtypes" id="aws-dsf.processing.SparkEmrServerlessJobProps.property.cloudWatchLogtypes"></a>

```typescript
public readonly cloudWatchLogtypes: string;
```

- *Type:* string

---

##### `executionRoleArn`<sup>Optional</sup> <a name="executionRoleArn" id="aws-dsf.processing.SparkEmrServerlessJobProps.property.executionRoleArn"></a>

```typescript
public readonly executionRoleArn: string;
```

- *Type:* string

---

##### `executionTimeoutMinutes`<sup>Optional</sup> <a name="executionTimeoutMinutes" id="aws-dsf.processing.SparkEmrServerlessJobProps.property.executionTimeoutMinutes"></a>

```typescript
public readonly executionTimeoutMinutes: number;
```

- *Type:* number

---

##### `persistentAppUi`<sup>Optional</sup> <a name="persistentAppUi" id="aws-dsf.processing.SparkEmrServerlessJobProps.property.persistentAppUi"></a>

```typescript
public readonly persistentAppUi: boolean;
```

- *Type:* boolean

---

##### `persistentAppUIKeyArn`<sup>Optional</sup> <a name="persistentAppUIKeyArn" id="aws-dsf.processing.SparkEmrServerlessJobProps.property.persistentAppUIKeyArn"></a>

```typescript
public readonly persistentAppUIKeyArn: string;
```

- *Type:* string

---

##### `s3LogUri`<sup>Optional</sup> <a name="s3LogUri" id="aws-dsf.processing.SparkEmrServerlessJobProps.property.s3LogUri"></a>

```typescript
public readonly s3LogUri: string;
```

- *Type:* string

---

##### `s3LogUriKeyArn`<sup>Optional</sup> <a name="s3LogUriKeyArn" id="aws-dsf.processing.SparkEmrServerlessJobProps.property.s3LogUriKeyArn"></a>

```typescript
public readonly s3LogUriKeyArn: string;
```

- *Type:* string

---

##### `sparkSubmitEntryPointArguments`<sup>Optional</sup> <a name="sparkSubmitEntryPointArguments" id="aws-dsf.processing.SparkEmrServerlessJobProps.property.sparkSubmitEntryPointArguments"></a>

```typescript
public readonly sparkSubmitEntryPointArguments: string[];
```

- *Type:* string[]

---

##### `sparkSubmitParameters`<sup>Optional</sup> <a name="sparkSubmitParameters" id="aws-dsf.processing.SparkEmrServerlessJobProps.property.sparkSubmitParameters"></a>

```typescript
public readonly sparkSubmitParameters: string;
```

- *Type:* string

---

##### `tags`<sup>Optional</sup> <a name="tags" id="aws-dsf.processing.SparkEmrServerlessJobProps.property.tags"></a>

```typescript
public readonly tags: {[ key: string ]: any};
```

- *Type:* {[ key: string ]: any}

---

### SparkEmrServerlessRuntimeProps <a name="SparkEmrServerlessRuntimeProps" id="aws-dsf.processing.SparkEmrServerlessRuntimeProps"></a>

Properties for the {SparkRuntimeServerless} construct.

#### Initializer <a name="Initializer" id="aws-dsf.processing.SparkEmrServerlessRuntimeProps.Initializer"></a>

```typescript
import { processing } from 'aws-dsf'

const sparkEmrServerlessRuntimeProps: processing.SparkEmrServerlessRuntimeProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessRuntimeProps.property.name">name</a></code> | <code>string</code> | The name of the application. The name must be less than 64 characters. |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessRuntimeProps.property.architecture">architecture</a></code> | <code>aws-dsf.processing.Architecture</code> | The CPU architecture type of the application. |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessRuntimeProps.property.autoStartConfiguration">autoStartConfiguration</a></code> | <code>aws-cdk-lib.IResolvable \| aws-cdk-lib.aws_emrserverless.CfnApplication.AutoStartConfigurationProperty</code> | The configuration for an application to automatically start on job submission. |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessRuntimeProps.property.autoStopConfiguration">autoStopConfiguration</a></code> | <code>aws-cdk-lib.IResolvable \| aws-cdk-lib.aws_emrserverless.CfnApplication.AutoStopConfigurationProperty</code> | The configuration for an application to automatically stop after a certain amount of time being idle. |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessRuntimeProps.property.imageConfiguration">imageConfiguration</a></code> | <code>aws-cdk-lib.IResolvable \| aws-cdk-lib.aws_emrserverless.CfnApplication.ImageConfigurationInputProperty</code> | The image configuration. |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessRuntimeProps.property.initialCapacity">initialCapacity</a></code> | <code>aws-cdk-lib.IResolvable \| aws-cdk-lib.IResolvable \| aws-cdk-lib.aws_emrserverless.CfnApplication.InitialCapacityConfigKeyValuePairProperty[]</code> | The initial capacity of the application. |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessRuntimeProps.property.maximumCapacity">maximumCapacity</a></code> | <code>aws-cdk-lib.IResolvable \| aws-cdk-lib.aws_emrserverless.CfnApplication.MaximumAllowedResourcesProperty</code> | The maximum capacity of the application. |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessRuntimeProps.property.networkConfiguration">networkConfiguration</a></code> | <code>aws-cdk-lib.IResolvable \| aws-cdk-lib.aws_emrserverless.CfnApplication.NetworkConfigurationProperty</code> | The network configuration for customer VPC connectivity for the application. |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessRuntimeProps.property.releaseLabel">releaseLabel</a></code> | <code>aws-dsf.processing.EmrRuntimeVersion</code> | The EMR release version associated with the application. |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessRuntimeProps.property.removalPolicy">removalPolicy</a></code> | <code>aws-cdk-lib.RemovalPolicy</code> | The removal policy when deleting the CDK resource. |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessRuntimeProps.property.runtimeConfiguration">runtimeConfiguration</a></code> | <code>aws-cdk-lib.IResolvable \| aws-cdk-lib.aws_emrserverless.CfnApplication.ConfigurationObjectProperty[]</code> | The runtime and monitoring configurations to used as defaults for all of the job runs of this application. |
| <code><a href="#aws-dsf.processing.SparkEmrServerlessRuntimeProps.property.workerTypeSpecifications">workerTypeSpecifications</a></code> | <code>aws-cdk-lib.IResolvable \| {[ key: string ]: aws-cdk-lib.IResolvable \| aws-cdk-lib.aws_emrserverless.CfnApplication.WorkerTypeSpecificationInputProperty}</code> | The container image to use in the application. |

---

##### `name`<sup>Required</sup> <a name="name" id="aws-dsf.processing.SparkEmrServerlessRuntimeProps.property.name"></a>

```typescript
public readonly name: string;
```

- *Type:* string

The name of the application. The name must be less than 64 characters.

*Pattern* : `^[A-Za-z0-9._\\/#-]+$`

---

##### `architecture`<sup>Optional</sup> <a name="architecture" id="aws-dsf.processing.SparkEmrServerlessRuntimeProps.property.architecture"></a>

```typescript
public readonly architecture: Architecture;
```

- *Type:* aws-dsf.processing.Architecture

The CPU architecture type of the application.

---

##### `autoStartConfiguration`<sup>Optional</sup> <a name="autoStartConfiguration" id="aws-dsf.processing.SparkEmrServerlessRuntimeProps.property.autoStartConfiguration"></a>

```typescript
public readonly autoStartConfiguration: IResolvable | AutoStartConfigurationProperty;
```

- *Type:* aws-cdk-lib.IResolvable | aws-cdk-lib.aws_emrserverless.CfnApplication.AutoStartConfigurationProperty

The configuration for an application to automatically start on job submission.

---

##### `autoStopConfiguration`<sup>Optional</sup> <a name="autoStopConfiguration" id="aws-dsf.processing.SparkEmrServerlessRuntimeProps.property.autoStopConfiguration"></a>

```typescript
public readonly autoStopConfiguration: IResolvable | AutoStopConfigurationProperty;
```

- *Type:* aws-cdk-lib.IResolvable | aws-cdk-lib.aws_emrserverless.CfnApplication.AutoStopConfigurationProperty

The configuration for an application to automatically stop after a certain amount of time being idle.

---

##### `imageConfiguration`<sup>Optional</sup> <a name="imageConfiguration" id="aws-dsf.processing.SparkEmrServerlessRuntimeProps.property.imageConfiguration"></a>

```typescript
public readonly imageConfiguration: IResolvable | ImageConfigurationInputProperty;
```

- *Type:* aws-cdk-lib.IResolvable | aws-cdk-lib.aws_emrserverless.CfnApplication.ImageConfigurationInputProperty

The image configuration.

---

##### `initialCapacity`<sup>Optional</sup> <a name="initialCapacity" id="aws-dsf.processing.SparkEmrServerlessRuntimeProps.property.initialCapacity"></a>

```typescript
public readonly initialCapacity: IResolvable | IResolvable | InitialCapacityConfigKeyValuePairProperty[];
```

- *Type:* aws-cdk-lib.IResolvable | aws-cdk-lib.IResolvable | aws-cdk-lib.aws_emrserverless.CfnApplication.InitialCapacityConfigKeyValuePairProperty[]

The initial capacity of the application.

---

##### `maximumCapacity`<sup>Optional</sup> <a name="maximumCapacity" id="aws-dsf.processing.SparkEmrServerlessRuntimeProps.property.maximumCapacity"></a>

```typescript
public readonly maximumCapacity: IResolvable | MaximumAllowedResourcesProperty;
```

- *Type:* aws-cdk-lib.IResolvable | aws-cdk-lib.aws_emrserverless.CfnApplication.MaximumAllowedResourcesProperty

The maximum capacity of the application.

This is cumulative across all workers at any given point in time during the lifespan of the application is created. No new resources will be created once any one of the defined limits is hit.

---

##### `networkConfiguration`<sup>Optional</sup> <a name="networkConfiguration" id="aws-dsf.processing.SparkEmrServerlessRuntimeProps.property.networkConfiguration"></a>

```typescript
public readonly networkConfiguration: IResolvable | NetworkConfigurationProperty;
```

- *Type:* aws-cdk-lib.IResolvable | aws-cdk-lib.aws_emrserverless.CfnApplication.NetworkConfigurationProperty
- *Default:* a VPC and a security group are created, these are accessed as construct attribute.

The network configuration for customer VPC connectivity for the application.

If no configuration is created, the a VPC with 3 public subnets and 3 private subnets is created
The 3 public subnets and 3 private subnets are each created in an Availability Zone (AZ)
The VPC has one NAT Gateway per AZ and an S3 endpoint

---

##### `releaseLabel`<sup>Optional</sup> <a name="releaseLabel" id="aws-dsf.processing.SparkEmrServerlessRuntimeProps.property.releaseLabel"></a>

```typescript
public readonly releaseLabel: EmrRuntimeVersion;
```

- *Type:* aws-dsf.processing.EmrRuntimeVersion

The EMR release version associated with the application.

The EMR release can be found in this [documentation](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-release-6x.html)

> [EMR_DEFAULT_VERSION](EMR_DEFAULT_VERSION)

---

##### `removalPolicy`<sup>Optional</sup> <a name="removalPolicy" id="aws-dsf.processing.SparkEmrServerlessRuntimeProps.property.removalPolicy"></a>

```typescript
public readonly removalPolicy: RemovalPolicy;
```

- *Type:* aws-cdk-lib.RemovalPolicy
- *Default:* The resources are not deleted (`RemovalPolicy.RETAIN`).

The removal policy when deleting the CDK resource.

Resources like Amazon cloudwatch log or Amazon S3 bucket
If DESTROY is selected, context value

---

##### `runtimeConfiguration`<sup>Optional</sup> <a name="runtimeConfiguration" id="aws-dsf.processing.SparkEmrServerlessRuntimeProps.property.runtimeConfiguration"></a>

```typescript
public readonly runtimeConfiguration: IResolvable | ConfigurationObjectProperty[];
```

- *Type:* aws-cdk-lib.IResolvable | aws-cdk-lib.aws_emrserverless.CfnApplication.ConfigurationObjectProperty[]

The runtime and monitoring configurations to used as defaults for all of the job runs of this application.

---

##### `workerTypeSpecifications`<sup>Optional</sup> <a name="workerTypeSpecifications" id="aws-dsf.processing.SparkEmrServerlessRuntimeProps.property.workerTypeSpecifications"></a>

```typescript
public readonly workerTypeSpecifications: IResolvable | {[ key: string ]: IResolvable | WorkerTypeSpecificationInputProperty};
```

- *Type:* aws-cdk-lib.IResolvable | {[ key: string ]: aws-cdk-lib.IResolvable | aws-cdk-lib.aws_emrserverless.CfnApplication.WorkerTypeSpecificationInputProperty}

The container image to use in the application.

If none is provided the application will use the base Amazon EMR Serverless image for the specified EMR release.
This is an [example](https://docs.aws.amazon.com/emr/latest/EMR-Serverless-UserGuide/application-custom-image.html) of usage

---

### SparkJobProps <a name="SparkJobProps" id="aws-dsf.processing.SparkJobProps"></a>

Properties for the SparkJob construct.

#### Initializer <a name="Initializer" id="aws-dsf.processing.SparkJobProps.Initializer"></a>

```typescript
import { processing } from 'aws-dsf'

const sparkJobProps: processing.SparkJobProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.processing.SparkJobProps.property.removalPolicy">removalPolicy</a></code> | <code>aws-cdk-lib.RemovalPolicy</code> | The removal policy when deleting the CDK resource. |
| <code><a href="#aws-dsf.processing.SparkJobProps.property.schedule">schedule</a></code> | <code>aws-cdk-lib.aws_events.Schedule</code> | Schedule to run the Step Functions state machine. |

---

##### `removalPolicy`<sup>Optional</sup> <a name="removalPolicy" id="aws-dsf.processing.SparkJobProps.property.removalPolicy"></a>

```typescript
public readonly removalPolicy: RemovalPolicy;
```

- *Type:* aws-cdk-lib.RemovalPolicy
- *Default:* The resources are not deleted (`RemovalPolicy.RETAIN`).

The removal policy when deleting the CDK resource.

If DESTROY is selected, context value `@data-solutions-framework-on-aws/removeDataOnDestroy` needs to be set to true.
Otherwise the removalPolicy is reverted to RETAIN.

---

##### `schedule`<sup>Optional</sup> <a name="schedule" id="aws-dsf.processing.SparkJobProps.property.schedule"></a>

```typescript
public readonly schedule: Schedule;
```

- *Type:* aws-cdk-lib.aws_events.Schedule

Schedule to run the Step Functions state machine.

> [Schedule](Schedule)

> [[https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_events.Schedule.html]]([https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_events.Schedule.html])

---

### TrackedConstructProps <a name="TrackedConstructProps" id="aws-dsf.utils.TrackedConstructProps"></a>

The properties for the TrackedConstructProps construct.

#### Initializer <a name="Initializer" id="aws-dsf.utils.TrackedConstructProps.Initializer"></a>

```typescript
import { utils } from 'aws-dsf'

const trackedConstructProps: utils.TrackedConstructProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-dsf.utils.TrackedConstructProps.property.trackingTag">trackingTag</a></code> | <code>string</code> | Unique code used to measure the number of CloudFormation deployments of this construct. |

---

##### `trackingTag`<sup>Required</sup> <a name="trackingTag" id="aws-dsf.utils.TrackedConstructProps.property.trackingTag"></a>

```typescript
public readonly trackingTag: string;
```

- *Type:* string

Unique code used to measure the number of CloudFormation deployments of this construct.

*Pattern* : `^[A-Za-z0-9-_]+$`

---

## Classes <a name="Classes" id="Classes"></a>

### ApplicationStackFactory <a name="ApplicationStackFactory" id="aws-dsf.utils.ApplicationStackFactory"></a>

Abstract class that needs to be implemented to pass the application Stack to the CICD pipeline.

*Example*

```typescript
interface MyApplicationStackProps extends cdk.StackProps {
  readonly stage: dsf.utils.CICDStage;
}

class MyApplicationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: MyApplicationStackProps) {
    super(scope, id, props);
    // stack logic goes here... and can be customized using props.stage
  }
}

class MyApplicationStackFactory extends dsf.utils.ApplicationStackFactory {
  createStack(scope: Construct, stage: dsf.utils.CICDStage): cdk.Stack {
    return new MyApplicationStack(scope, 'MyApplication', {
      stage: stage
    } as MyApplicationStackProps);
  }
}
```


#### Initializers <a name="Initializers" id="aws-dsf.utils.ApplicationStackFactory.Initializer"></a>

```typescript
import { utils } from 'aws-dsf'

new utils.ApplicationStackFactory()
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-dsf.utils.ApplicationStackFactory.createStack">createStack</a></code> | Abstract method that needs to be implemented to return the application Stack. |

---

##### `createStack` <a name="createStack" id="aws-dsf.utils.ApplicationStackFactory.createStack"></a>

```typescript
public createStack(scope: Construct, stage: CICDStage): Stack
```

Abstract method that needs to be implemented to return the application Stack.

###### `scope`<sup>Required</sup> <a name="scope" id="aws-dsf.utils.ApplicationStackFactory.createStack.parameter.scope"></a>

- *Type:* constructs.Construct

The scope to create the stack in.

---

###### `stage`<sup>Required</sup> <a name="stage" id="aws-dsf.utils.ApplicationStackFactory.createStack.parameter.stage"></a>

- *Type:* aws-dsf.utils.CICDStage

The stage of the pipeline.

---




### BucketUtils <a name="BucketUtils" id="aws-dsf.utils.BucketUtils"></a>

Utils for working with Amazon S3 buckets.

#### Initializers <a name="Initializers" id="aws-dsf.utils.BucketUtils.Initializer"></a>

```typescript
import { utils } from 'aws-dsf'

new utils.BucketUtils()
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |

---


#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-dsf.utils.BucketUtils.generateUniqueBucketName">generateUniqueBucketName</a></code> | Generate a unique Amazon S3 bucket name based on the provided name, CDK construct ID and CDK construct scope. |

---

##### `generateUniqueBucketName` <a name="generateUniqueBucketName" id="aws-dsf.utils.BucketUtils.generateUniqueBucketName"></a>

```typescript
import { utils } from 'aws-dsf'

utils.BucketUtils.generateUniqueBucketName(scope: Construct, id: string, name: string)
```

Generate a unique Amazon S3 bucket name based on the provided name, CDK construct ID and CDK construct scope.

The bucket name is suffixed the AWS account ID, the AWS region and a unique 8 characters hash.
The maximum length for name is 26 characters.

###### `scope`<sup>Required</sup> <a name="scope" id="aws-dsf.utils.BucketUtils.generateUniqueBucketName.parameter.scope"></a>

- *Type:* constructs.Construct

the current scope where the construct is created (generally `this`).

---

###### `id`<sup>Required</sup> <a name="id" id="aws-dsf.utils.BucketUtils.generateUniqueBucketName.parameter.id"></a>

- *Type:* string

the CDK ID of the construct.

---

###### `name`<sup>Required</sup> <a name="name" id="aws-dsf.utils.BucketUtils.generateUniqueBucketName.parameter.name"></a>

- *Type:* string

the name of the bucket.

---



### StepFunctionUtils <a name="StepFunctionUtils" id="aws-dsf.utils.StepFunctionUtils"></a>

#### Initializers <a name="Initializers" id="aws-dsf.utils.StepFunctionUtils.Initializer"></a>

```typescript
import { utils } from 'aws-dsf'

new utils.StepFunctionUtils()
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |

---


#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-dsf.utils.StepFunctionUtils.camelToPascal">camelToPascal</a></code> | Internal function to convert camel case properties to pascal case as required by AWS Step Functions API. |

---

##### `camelToPascal` <a name="camelToPascal" id="aws-dsf.utils.StepFunctionUtils.camelToPascal"></a>

```typescript
import { utils } from 'aws-dsf'

utils.StepFunctionUtils.camelToPascal(config: {[ key: string ]: any})
```

Internal function to convert camel case properties to pascal case as required by AWS Step Functions API.

###### `config`<sup>Required</sup> <a name="config" id="aws-dsf.utils.StepFunctionUtils.camelToPascal.parameter.config"></a>

- *Type:* {[ key: string ]: any}

---



### Utils <a name="Utils" id="aws-dsf.utils.Utils"></a>

Utilities class used across the different resources.

#### Initializers <a name="Initializers" id="aws-dsf.utils.Utils.Initializer"></a>

```typescript
import { utils } from 'aws-dsf'

new utils.Utils()
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |

---


#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-dsf.utils.Utils.generateHash">generateHash</a></code> | Generate an 8 character hash from a string based on HMAC algorithm. |
| <code><a href="#aws-dsf.utils.Utils.generateUniqueHash">generateUniqueHash</a></code> | Generate a unique hash of 8 characters from the CDK scope using its path and the stack name. |
| <code><a href="#aws-dsf.utils.Utils.loadYaml">loadYaml</a></code> | Take a document stored as string and load it as YAML. |
| <code><a href="#aws-dsf.utils.Utils.randomize">randomize</a></code> | Create a random string to be used as a seed for IAM User password. |
| <code><a href="#aws-dsf.utils.Utils.readYamlDocument">readYamlDocument</a></code> | Read a YAML file from the path provided and return it. |
| <code><a href="#aws-dsf.utils.Utils.stringSanitizer">stringSanitizer</a></code> | Sanitize a string by removing upper case and replacing special characters except underscore. |
| <code><a href="#aws-dsf.utils.Utils.toPascalCase">toPascalCase</a></code> | Convert a string to PascalCase. |

---

##### `generateHash` <a name="generateHash" id="aws-dsf.utils.Utils.generateHash"></a>

```typescript
import { utils } from 'aws-dsf'

utils.Utils.generateHash(text: string)
```

Generate an 8 character hash from a string based on HMAC algorithm.

###### `text`<sup>Required</sup> <a name="text" id="aws-dsf.utils.Utils.generateHash.parameter.text"></a>

- *Type:* string

the text to hash.

---

##### `generateUniqueHash` <a name="generateUniqueHash" id="aws-dsf.utils.Utils.generateUniqueHash"></a>

```typescript
import { utils } from 'aws-dsf'

utils.Utils.generateUniqueHash(scope: Construct, id?: string)
```

Generate a unique hash of 8 characters from the CDK scope using its path and the stack name.

###### `scope`<sup>Required</sup> <a name="scope" id="aws-dsf.utils.Utils.generateUniqueHash.parameter.scope"></a>

- *Type:* constructs.Construct

the CDK construct scope.

---

###### `id`<sup>Optional</sup> <a name="id" id="aws-dsf.utils.Utils.generateUniqueHash.parameter.id"></a>

- *Type:* string

the CDK ID of the construct.

---

##### `loadYaml` <a name="loadYaml" id="aws-dsf.utils.Utils.loadYaml"></a>

```typescript
import { utils } from 'aws-dsf'

utils.Utils.loadYaml(document: string)
```

Take a document stored as string and load it as YAML.

###### `document`<sup>Required</sup> <a name="document" id="aws-dsf.utils.Utils.loadYaml.parameter.document"></a>

- *Type:* string

the document stored as string.

---

##### `randomize` <a name="randomize" id="aws-dsf.utils.Utils.randomize"></a>

```typescript
import { utils } from 'aws-dsf'

utils.Utils.randomize(name: string)
```

Create a random string to be used as a seed for IAM User password.

###### `name`<sup>Required</sup> <a name="name" id="aws-dsf.utils.Utils.randomize.parameter.name"></a>

- *Type:* string

the string to which to append a random string.

---

##### `readYamlDocument` <a name="readYamlDocument" id="aws-dsf.utils.Utils.readYamlDocument"></a>

```typescript
import { utils } from 'aws-dsf'

utils.Utils.readYamlDocument(path: string)
```

Read a YAML file from the path provided and return it.

###### `path`<sup>Required</sup> <a name="path" id="aws-dsf.utils.Utils.readYamlDocument.parameter.path"></a>

- *Type:* string

the path to the file.

---

##### `stringSanitizer` <a name="stringSanitizer" id="aws-dsf.utils.Utils.stringSanitizer"></a>

```typescript
import { utils } from 'aws-dsf'

utils.Utils.stringSanitizer(toSanitize: string)
```

Sanitize a string by removing upper case and replacing special characters except underscore.

###### `toSanitize`<sup>Required</sup> <a name="toSanitize" id="aws-dsf.utils.Utils.stringSanitizer.parameter.toSanitize"></a>

- *Type:* string

the string to sanitize.

---

##### `toPascalCase` <a name="toPascalCase" id="aws-dsf.utils.Utils.toPascalCase"></a>

```typescript
import { utils } from 'aws-dsf'

utils.Utils.toPascalCase(text: string)
```

Convert a string to PascalCase.

###### `text`<sup>Required</sup> <a name="text" id="aws-dsf.utils.Utils.toPascalCase.parameter.text"></a>

- *Type:* string

---




## Enums <a name="Enums" id="Enums"></a>

### Architecture <a name="Architecture" id="aws-dsf.processing.Architecture"></a>

Enum defining the CPU architecture type of the application, either  X86_64 or ARM64.

#### Members <a name="Members" id="Members"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-dsf.processing.Architecture.X86_64">X86_64</a></code> | *No description.* |
| <code><a href="#aws-dsf.processing.Architecture.ARM64">ARM64</a></code> | *No description.* |

---

##### `X86_64` <a name="X86_64" id="aws-dsf.processing.Architecture.X86_64"></a>

---


##### `ARM64` <a name="ARM64" id="aws-dsf.processing.Architecture.ARM64"></a>

---


### CICDStage <a name="CICDStage" id="aws-dsf.utils.CICDStage"></a>

The list of CICD Stages to deploy the SparkCICDStack.

#### Members <a name="Members" id="Members"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-dsf.utils.CICDStage.STAGING">STAGING</a></code> | *No description.* |
| <code><a href="#aws-dsf.utils.CICDStage.PROD">PROD</a></code> | *No description.* |

---

##### `STAGING` <a name="STAGING" id="aws-dsf.utils.CICDStage.STAGING"></a>

---


##### `PROD` <a name="PROD" id="aws-dsf.utils.CICDStage.PROD"></a>

---


### EmrRuntimeVersion <a name="EmrRuntimeVersion" id="aws-dsf.processing.EmrRuntimeVersion"></a>

Enum defining the EMR version as defined [here](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-release-6x.html).

#### Members <a name="Members" id="Members"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-dsf.processing.EmrRuntimeVersion.V7_0">V7_0</a></code> | *No description.* |
| <code><a href="#aws-dsf.processing.EmrRuntimeVersion.V6_15">V6_15</a></code> | *No description.* |
| <code><a href="#aws-dsf.processing.EmrRuntimeVersion.V6_14">V6_14</a></code> | *No description.* |
| <code><a href="#aws-dsf.processing.EmrRuntimeVersion.V6_13">V6_13</a></code> | *No description.* |
| <code><a href="#aws-dsf.processing.EmrRuntimeVersion.V6_12">V6_12</a></code> | *No description.* |
| <code><a href="#aws-dsf.processing.EmrRuntimeVersion.V6_11_1">V6_11_1</a></code> | *No description.* |
| <code><a href="#aws-dsf.processing.EmrRuntimeVersion.V6_11">V6_11</a></code> | *No description.* |
| <code><a href="#aws-dsf.processing.EmrRuntimeVersion.V6_10_1">V6_10_1</a></code> | *No description.* |
| <code><a href="#aws-dsf.processing.EmrRuntimeVersion.V6_10">V6_10</a></code> | *No description.* |
| <code><a href="#aws-dsf.processing.EmrRuntimeVersion.V6_9">V6_9</a></code> | *No description.* |
| <code><a href="#aws-dsf.processing.EmrRuntimeVersion.V6_8">V6_8</a></code> | *No description.* |
| <code><a href="#aws-dsf.processing.EmrRuntimeVersion.V6_7">V6_7</a></code> | *No description.* |
| <code><a href="#aws-dsf.processing.EmrRuntimeVersion.V6_6">V6_6</a></code> | *No description.* |
| <code><a href="#aws-dsf.processing.EmrRuntimeVersion.V6_5">V6_5</a></code> | *No description.* |
| <code><a href="#aws-dsf.processing.EmrRuntimeVersion.V6_4">V6_4</a></code> | *No description.* |
| <code><a href="#aws-dsf.processing.EmrRuntimeVersion.V6_3">V6_3</a></code> | *No description.* |
| <code><a href="#aws-dsf.processing.EmrRuntimeVersion.V6_2">V6_2</a></code> | *No description.* |
| <code><a href="#aws-dsf.processing.EmrRuntimeVersion.V5_33">V5_33</a></code> | *No description.* |
| <code><a href="#aws-dsf.processing.EmrRuntimeVersion.V5_32">V5_32</a></code> | *No description.* |

---

##### `V7_0` <a name="V7_0" id="aws-dsf.processing.EmrRuntimeVersion.V7_0"></a>

---


##### `V6_15` <a name="V6_15" id="aws-dsf.processing.EmrRuntimeVersion.V6_15"></a>

---


##### `V6_14` <a name="V6_14" id="aws-dsf.processing.EmrRuntimeVersion.V6_14"></a>

---


##### `V6_13` <a name="V6_13" id="aws-dsf.processing.EmrRuntimeVersion.V6_13"></a>

---


##### `V6_12` <a name="V6_12" id="aws-dsf.processing.EmrRuntimeVersion.V6_12"></a>

---


##### `V6_11_1` <a name="V6_11_1" id="aws-dsf.processing.EmrRuntimeVersion.V6_11_1"></a>

---


##### `V6_11` <a name="V6_11" id="aws-dsf.processing.EmrRuntimeVersion.V6_11"></a>

---


##### `V6_10_1` <a name="V6_10_1" id="aws-dsf.processing.EmrRuntimeVersion.V6_10_1"></a>

---


##### `V6_10` <a name="V6_10" id="aws-dsf.processing.EmrRuntimeVersion.V6_10"></a>

---


##### `V6_9` <a name="V6_9" id="aws-dsf.processing.EmrRuntimeVersion.V6_9"></a>

---


##### `V6_8` <a name="V6_8" id="aws-dsf.processing.EmrRuntimeVersion.V6_8"></a>

---


##### `V6_7` <a name="V6_7" id="aws-dsf.processing.EmrRuntimeVersion.V6_7"></a>

---


##### `V6_6` <a name="V6_6" id="aws-dsf.processing.EmrRuntimeVersion.V6_6"></a>

---


##### `V6_5` <a name="V6_5" id="aws-dsf.processing.EmrRuntimeVersion.V6_5"></a>

---


##### `V6_4` <a name="V6_4" id="aws-dsf.processing.EmrRuntimeVersion.V6_4"></a>

---


##### `V6_3` <a name="V6_3" id="aws-dsf.processing.EmrRuntimeVersion.V6_3"></a>

---


##### `V6_2` <a name="V6_2" id="aws-dsf.processing.EmrRuntimeVersion.V6_2"></a>

---


##### `V5_33` <a name="V5_33" id="aws-dsf.processing.EmrRuntimeVersion.V5_33"></a>

---


##### `V5_32` <a name="V5_32" id="aws-dsf.processing.EmrRuntimeVersion.V5_32"></a>

---


### KarpenterVersion <a name="KarpenterVersion" id="aws-dsf.processing.KarpenterVersion"></a>

Enum defining the Karpenter versions as defined [here](https://github.com/aws/karpenter/releases).

#### Members <a name="Members" id="Members"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-dsf.processing.KarpenterVersion.V0_32_1">V0_32_1</a></code> | *No description.* |

---

##### `V0_32_1` <a name="V0_32_1" id="aws-dsf.processing.KarpenterVersion.V0_32_1"></a>

---


### SparkImage <a name="SparkImage" id="aws-dsf.processing.SparkImage"></a>

The list of supported Spark images to use in the SparkCICDPipeline.

#### Members <a name="Members" id="Members"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-dsf.processing.SparkImage.EMR_7_0">EMR_7_0</a></code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkImage.EMR_6_15">EMR_6_15</a></code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkImage.EMR_6_14">EMR_6_14</a></code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkImage.EMR_6_13">EMR_6_13</a></code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkImage.EMR_6_12">EMR_6_12</a></code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkImage.EMR_6_11">EMR_6_11</a></code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkImage.EMR_6_10">EMR_6_10</a></code> | *No description.* |
| <code><a href="#aws-dsf.processing.SparkImage.EMR_6_9">EMR_6_9</a></code> | *No description.* |

---

##### `EMR_7_0` <a name="EMR_7_0" id="aws-dsf.processing.SparkImage.EMR_7_0"></a>

---


##### `EMR_6_15` <a name="EMR_6_15" id="aws-dsf.processing.SparkImage.EMR_6_15"></a>

---


##### `EMR_6_14` <a name="EMR_6_14" id="aws-dsf.processing.SparkImage.EMR_6_14"></a>

---


##### `EMR_6_13` <a name="EMR_6_13" id="aws-dsf.processing.SparkImage.EMR_6_13"></a>

---


##### `EMR_6_12` <a name="EMR_6_12" id="aws-dsf.processing.SparkImage.EMR_6_12"></a>

---


##### `EMR_6_11` <a name="EMR_6_11" id="aws-dsf.processing.SparkImage.EMR_6_11"></a>

---


##### `EMR_6_10` <a name="EMR_6_10" id="aws-dsf.processing.SparkImage.EMR_6_10"></a>

---


##### `EMR_6_9` <a name="EMR_6_9" id="aws-dsf.processing.SparkImage.EMR_6_9"></a>

---

