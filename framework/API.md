# replace this
# API Reference <a name="API Reference" id="api-reference"></a>

## Constructs <a name="Constructs" id="Constructs"></a>

### AccessLogsBucket <a name="AccessLogsBucket" id="aws-data-solutions-framework.AccessLogsBucket"></a>

Amazon S3 Bucket configured with best-practices and smart defaults for storing S3 access logs.

*Example*

```typescript
import * as cdk from 'aws-cdk-lib';
import { AccessLogsBucket } from 'aws-data-solutions-framework';

const bucket = new AccessLogsBucket(this, 'AccessLogsBucket', {
 removalPolicy: RemovalPolicy.DESTROY,
})
```

#### Initializers <a name="Initializers" id="aws-data-solutions-framework.AccessLogsBucket.Initializer"></a>

```typescript
import { AccessLogsBucket } from 'aws-data-solutions-framework'

new AccessLogsBucket(scope: Construct, id: string, props?: BucketProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | *No description.* |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.Initializer.parameter.props">props</a></code> | <code>aws-cdk-lib.aws_s3.BucketProps</code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="aws-data-solutions-framework.AccessLogsBucket.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="aws-data-solutions-framework.AccessLogsBucket.Initializer.parameter.id"></a>

- *Type:* string

---

##### `props`<sup>Optional</sup> <a name="props" id="aws-data-solutions-framework.AccessLogsBucket.Initializer.parameter.props"></a>

- *Type:* aws-cdk-lib.aws_s3.BucketProps

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.applyRemovalPolicy">applyRemovalPolicy</a></code> | Apply the given removal policy to this resource. |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.addEventNotification">addEventNotification</a></code> | Adds a bucket notification event destination. |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.addObjectCreatedNotification">addObjectCreatedNotification</a></code> | Subscribes a destination to receive notifications when an object is created in the bucket. |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.addObjectRemovedNotification">addObjectRemovedNotification</a></code> | Subscribes a destination to receive notifications when an object is removed from the bucket. |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.addToResourcePolicy">addToResourcePolicy</a></code> | Adds a statement to the resource policy for a principal (i.e. account/role/service) to perform actions on this bucket and/or its contents. Use `bucketArn` and `arnForObjects(keys)` to obtain ARNs for this bucket or objects. |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.arnForObjects">arnForObjects</a></code> | Returns an ARN that represents all objects within the bucket that match the key pattern specified. |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.enableEventBridgeNotification">enableEventBridgeNotification</a></code> | Enables event bridge notification, causing all events below to be sent to EventBridge:. |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.grantDelete">grantDelete</a></code> | Grants s3:DeleteObject* permission to an IAM principal for objects in this bucket. |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.grantPublicAccess">grantPublicAccess</a></code> | Allows unrestricted access to objects from this bucket. |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.grantPut">grantPut</a></code> | Grants s3:PutObject* and s3:Abort* permissions for this bucket to an IAM principal. |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.grantPutAcl">grantPutAcl</a></code> | Grant the given IAM identity permissions to modify the ACLs of objects in the given Bucket. |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.grantRead">grantRead</a></code> | Grant read permissions for this bucket and it's contents to an IAM principal (Role/Group/User). |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.grantReadWrite">grantReadWrite</a></code> | Grants read/write permissions for this bucket and it's contents to an IAM principal (Role/Group/User). |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.grantWrite">grantWrite</a></code> | Grant write permissions to this bucket to an IAM principal. |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.onCloudTrailEvent">onCloudTrailEvent</a></code> | Define a CloudWatch event that triggers when something happens to this repository. |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.onCloudTrailPutObject">onCloudTrailPutObject</a></code> | Defines an AWS CloudWatch event that triggers when an object is uploaded to the specified paths (keys) in this bucket using the PutObject API call. |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.onCloudTrailWriteObject">onCloudTrailWriteObject</a></code> | Defines an AWS CloudWatch event that triggers when an object at the specified paths (keys) in this bucket are written to. |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.s3UrlForObject">s3UrlForObject</a></code> | The S3 URL of an S3 object. For example:. |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.transferAccelerationUrlForObject">transferAccelerationUrlForObject</a></code> | The https Transfer Acceleration URL of an S3 object. |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.urlForObject">urlForObject</a></code> | The https URL of an S3 object. Specify `regional: false` at the options for non-regional URLs. For example:. |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.virtualHostedUrlForObject">virtualHostedUrlForObject</a></code> | The virtual hosted-style URL of an S3 object. Specify `regional: false` at the options for non-regional URL. For example:. |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.addCorsRule">addCorsRule</a></code> | Adds a cross-origin access configuration for objects in an Amazon S3 bucket. |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.addInventory">addInventory</a></code> | Add an inventory configuration. |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.addLifecycleRule">addLifecycleRule</a></code> | Add a lifecycle rule to the bucket. |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.addMetric">addMetric</a></code> | Adds a metrics configuration for the CloudWatch request metrics from the bucket. |

---

##### `toString` <a name="toString" id="aws-data-solutions-framework.AccessLogsBucket.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `applyRemovalPolicy` <a name="applyRemovalPolicy" id="aws-data-solutions-framework.AccessLogsBucket.applyRemovalPolicy"></a>

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

###### `policy`<sup>Required</sup> <a name="policy" id="aws-data-solutions-framework.AccessLogsBucket.applyRemovalPolicy.parameter.policy"></a>

- *Type:* aws-cdk-lib.RemovalPolicy

---

##### `addEventNotification` <a name="addEventNotification" id="aws-data-solutions-framework.AccessLogsBucket.addEventNotification"></a>

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


###### `event`<sup>Required</sup> <a name="event" id="aws-data-solutions-framework.AccessLogsBucket.addEventNotification.parameter.event"></a>

- *Type:* aws-cdk-lib.aws_s3.EventType

The event to trigger the notification.

---

###### `dest`<sup>Required</sup> <a name="dest" id="aws-data-solutions-framework.AccessLogsBucket.addEventNotification.parameter.dest"></a>

- *Type:* aws-cdk-lib.aws_s3.IBucketNotificationDestination

The notification destination (Lambda, SNS Topic or SQS Queue).

---

###### `filters`<sup>Required</sup> <a name="filters" id="aws-data-solutions-framework.AccessLogsBucket.addEventNotification.parameter.filters"></a>

- *Type:* aws-cdk-lib.aws_s3.NotificationKeyFilter

S3 object key filter rules to determine which objects trigger this event.

Each filter must include a `prefix` and/or `suffix`
that will be matched against the s3 object key. Refer to the S3 Developer Guide
for details about allowed filter rules.

---

##### `addObjectCreatedNotification` <a name="addObjectCreatedNotification" id="aws-data-solutions-framework.AccessLogsBucket.addObjectCreatedNotification"></a>

```typescript
public addObjectCreatedNotification(dest: IBucketNotificationDestination, filters: NotificationKeyFilter): void
```

Subscribes a destination to receive notifications when an object is created in the bucket.

This is identical to calling
`onEvent(EventType.OBJECT_CREATED)`.

###### `dest`<sup>Required</sup> <a name="dest" id="aws-data-solutions-framework.AccessLogsBucket.addObjectCreatedNotification.parameter.dest"></a>

- *Type:* aws-cdk-lib.aws_s3.IBucketNotificationDestination

The notification destination (see onEvent).

---

###### `filters`<sup>Required</sup> <a name="filters" id="aws-data-solutions-framework.AccessLogsBucket.addObjectCreatedNotification.parameter.filters"></a>

- *Type:* aws-cdk-lib.aws_s3.NotificationKeyFilter

Filters (see onEvent).

---

##### `addObjectRemovedNotification` <a name="addObjectRemovedNotification" id="aws-data-solutions-framework.AccessLogsBucket.addObjectRemovedNotification"></a>

```typescript
public addObjectRemovedNotification(dest: IBucketNotificationDestination, filters: NotificationKeyFilter): void
```

Subscribes a destination to receive notifications when an object is removed from the bucket.

This is identical to calling
`onEvent(EventType.OBJECT_REMOVED)`.

###### `dest`<sup>Required</sup> <a name="dest" id="aws-data-solutions-framework.AccessLogsBucket.addObjectRemovedNotification.parameter.dest"></a>

- *Type:* aws-cdk-lib.aws_s3.IBucketNotificationDestination

The notification destination (see onEvent).

---

###### `filters`<sup>Required</sup> <a name="filters" id="aws-data-solutions-framework.AccessLogsBucket.addObjectRemovedNotification.parameter.filters"></a>

- *Type:* aws-cdk-lib.aws_s3.NotificationKeyFilter

Filters (see onEvent).

---

##### `addToResourcePolicy` <a name="addToResourcePolicy" id="aws-data-solutions-framework.AccessLogsBucket.addToResourcePolicy"></a>

```typescript
public addToResourcePolicy(permission: PolicyStatement): AddToResourcePolicyResult
```

Adds a statement to the resource policy for a principal (i.e. account/role/service) to perform actions on this bucket and/or its contents. Use `bucketArn` and `arnForObjects(keys)` to obtain ARNs for this bucket or objects.

Note that the policy statement may or may not be added to the policy.
For example, when an `IBucket` is created from an existing bucket,
it's not possible to tell whether the bucket already has a policy
attached, let alone to re-use that policy to add more statements to it.
So it's safest to do nothing in these cases.

###### `permission`<sup>Required</sup> <a name="permission" id="aws-data-solutions-framework.AccessLogsBucket.addToResourcePolicy.parameter.permission"></a>

- *Type:* aws-cdk-lib.aws_iam.PolicyStatement

the policy statement to be added to the bucket's policy.

---

##### `arnForObjects` <a name="arnForObjects" id="aws-data-solutions-framework.AccessLogsBucket.arnForObjects"></a>

```typescript
public arnForObjects(keyPattern: string): string
```

Returns an ARN that represents all objects within the bucket that match the key pattern specified.

To represent all keys, specify ``"*"``.

If you need to specify a keyPattern with multiple components, concatenate them into a single string, e.g.:

  arnForObjects(`home/${team}/${user}/*`)

###### `keyPattern`<sup>Required</sup> <a name="keyPattern" id="aws-data-solutions-framework.AccessLogsBucket.arnForObjects.parameter.keyPattern"></a>

- *Type:* string

---

##### `enableEventBridgeNotification` <a name="enableEventBridgeNotification" id="aws-data-solutions-framework.AccessLogsBucket.enableEventBridgeNotification"></a>

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

##### `grantDelete` <a name="grantDelete" id="aws-data-solutions-framework.AccessLogsBucket.grantDelete"></a>

```typescript
public grantDelete(identity: IGrantable, objectsKeyPattern?: any): Grant
```

Grants s3:DeleteObject* permission to an IAM principal for objects in this bucket.

###### `identity`<sup>Required</sup> <a name="identity" id="aws-data-solutions-framework.AccessLogsBucket.grantDelete.parameter.identity"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

The principal.

---

###### `objectsKeyPattern`<sup>Optional</sup> <a name="objectsKeyPattern" id="aws-data-solutions-framework.AccessLogsBucket.grantDelete.parameter.objectsKeyPattern"></a>

- *Type:* any

Restrict the permission to a certain key pattern (default '*').

---

##### `grantPublicAccess` <a name="grantPublicAccess" id="aws-data-solutions-framework.AccessLogsBucket.grantPublicAccess"></a>

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

###### `allowedActions`<sup>Required</sup> <a name="allowedActions" id="aws-data-solutions-framework.AccessLogsBucket.grantPublicAccess.parameter.allowedActions"></a>

- *Type:* string

the set of S3 actions to allow.

Default is "s3:GetObject".

---

###### `keyPrefix`<sup>Optional</sup> <a name="keyPrefix" id="aws-data-solutions-framework.AccessLogsBucket.grantPublicAccess.parameter.keyPrefix"></a>

- *Type:* string

the prefix of S3 object keys (e.g. `home/*`). Default is "*".

---

##### `grantPut` <a name="grantPut" id="aws-data-solutions-framework.AccessLogsBucket.grantPut"></a>

```typescript
public grantPut(identity: IGrantable, objectsKeyPattern?: any): Grant
```

Grants s3:PutObject* and s3:Abort* permissions for this bucket to an IAM principal.

If encryption is used, permission to use the key to encrypt the contents
of written files will also be granted to the same principal.

###### `identity`<sup>Required</sup> <a name="identity" id="aws-data-solutions-framework.AccessLogsBucket.grantPut.parameter.identity"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

The principal.

---

###### `objectsKeyPattern`<sup>Optional</sup> <a name="objectsKeyPattern" id="aws-data-solutions-framework.AccessLogsBucket.grantPut.parameter.objectsKeyPattern"></a>

- *Type:* any

Restrict the permission to a certain key pattern (default '*').

---

##### `grantPutAcl` <a name="grantPutAcl" id="aws-data-solutions-framework.AccessLogsBucket.grantPutAcl"></a>

```typescript
public grantPutAcl(identity: IGrantable, objectsKeyPattern?: string): Grant
```

Grant the given IAM identity permissions to modify the ACLs of objects in the given Bucket.

If your application has the '@aws-cdk/aws-s3:grantWriteWithoutAcl' feature flag set,
calling `grantWrite` or `grantReadWrite` no longer grants permissions to modify the ACLs of the objects;
in this case, if you need to modify object ACLs, call this method explicitly.

###### `identity`<sup>Required</sup> <a name="identity" id="aws-data-solutions-framework.AccessLogsBucket.grantPutAcl.parameter.identity"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

---

###### `objectsKeyPattern`<sup>Optional</sup> <a name="objectsKeyPattern" id="aws-data-solutions-framework.AccessLogsBucket.grantPutAcl.parameter.objectsKeyPattern"></a>

- *Type:* string

---

##### `grantRead` <a name="grantRead" id="aws-data-solutions-framework.AccessLogsBucket.grantRead"></a>

```typescript
public grantRead(identity: IGrantable, objectsKeyPattern?: any): Grant
```

Grant read permissions for this bucket and it's contents to an IAM principal (Role/Group/User).

If encryption is used, permission to use the key to decrypt the contents
of the bucket will also be granted to the same principal.

###### `identity`<sup>Required</sup> <a name="identity" id="aws-data-solutions-framework.AccessLogsBucket.grantRead.parameter.identity"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

The principal.

---

###### `objectsKeyPattern`<sup>Optional</sup> <a name="objectsKeyPattern" id="aws-data-solutions-framework.AccessLogsBucket.grantRead.parameter.objectsKeyPattern"></a>

- *Type:* any

Restrict the permission to a certain key pattern (default '*').

---

##### `grantReadWrite` <a name="grantReadWrite" id="aws-data-solutions-framework.AccessLogsBucket.grantReadWrite"></a>

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

###### `identity`<sup>Required</sup> <a name="identity" id="aws-data-solutions-framework.AccessLogsBucket.grantReadWrite.parameter.identity"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

---

###### `objectsKeyPattern`<sup>Optional</sup> <a name="objectsKeyPattern" id="aws-data-solutions-framework.AccessLogsBucket.grantReadWrite.parameter.objectsKeyPattern"></a>

- *Type:* any

---

##### `grantWrite` <a name="grantWrite" id="aws-data-solutions-framework.AccessLogsBucket.grantWrite"></a>

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

###### `identity`<sup>Required</sup> <a name="identity" id="aws-data-solutions-framework.AccessLogsBucket.grantWrite.parameter.identity"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

---

###### `objectsKeyPattern`<sup>Optional</sup> <a name="objectsKeyPattern" id="aws-data-solutions-framework.AccessLogsBucket.grantWrite.parameter.objectsKeyPattern"></a>

- *Type:* any

---

###### `allowedActionPatterns`<sup>Optional</sup> <a name="allowedActionPatterns" id="aws-data-solutions-framework.AccessLogsBucket.grantWrite.parameter.allowedActionPatterns"></a>

- *Type:* string[]

---

##### `onCloudTrailEvent` <a name="onCloudTrailEvent" id="aws-data-solutions-framework.AccessLogsBucket.onCloudTrailEvent"></a>

```typescript
public onCloudTrailEvent(id: string, options?: OnCloudTrailBucketEventOptions): Rule
```

Define a CloudWatch event that triggers when something happens to this repository.

Requires that there exists at least one CloudTrail Trail in your account
that captures the event. This method will not create the Trail.

###### `id`<sup>Required</sup> <a name="id" id="aws-data-solutions-framework.AccessLogsBucket.onCloudTrailEvent.parameter.id"></a>

- *Type:* string

The id of the rule.

---

###### `options`<sup>Optional</sup> <a name="options" id="aws-data-solutions-framework.AccessLogsBucket.onCloudTrailEvent.parameter.options"></a>

- *Type:* aws-cdk-lib.aws_s3.OnCloudTrailBucketEventOptions

Options for adding the rule.

---

##### `onCloudTrailPutObject` <a name="onCloudTrailPutObject" id="aws-data-solutions-framework.AccessLogsBucket.onCloudTrailPutObject"></a>

```typescript
public onCloudTrailPutObject(id: string, options?: OnCloudTrailBucketEventOptions): Rule
```

Defines an AWS CloudWatch event that triggers when an object is uploaded to the specified paths (keys) in this bucket using the PutObject API call.

Note that some tools like `aws s3 cp` will automatically use either
PutObject or the multipart upload API depending on the file size,
so using `onCloudTrailWriteObject` may be preferable.

Requires that there exists at least one CloudTrail Trail in your account
that captures the event. This method will not create the Trail.

###### `id`<sup>Required</sup> <a name="id" id="aws-data-solutions-framework.AccessLogsBucket.onCloudTrailPutObject.parameter.id"></a>

- *Type:* string

The id of the rule.

---

###### `options`<sup>Optional</sup> <a name="options" id="aws-data-solutions-framework.AccessLogsBucket.onCloudTrailPutObject.parameter.options"></a>

- *Type:* aws-cdk-lib.aws_s3.OnCloudTrailBucketEventOptions

Options for adding the rule.

---

##### `onCloudTrailWriteObject` <a name="onCloudTrailWriteObject" id="aws-data-solutions-framework.AccessLogsBucket.onCloudTrailWriteObject"></a>

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

###### `id`<sup>Required</sup> <a name="id" id="aws-data-solutions-framework.AccessLogsBucket.onCloudTrailWriteObject.parameter.id"></a>

- *Type:* string

The id of the rule.

---

###### `options`<sup>Optional</sup> <a name="options" id="aws-data-solutions-framework.AccessLogsBucket.onCloudTrailWriteObject.parameter.options"></a>

- *Type:* aws-cdk-lib.aws_s3.OnCloudTrailBucketEventOptions

Options for adding the rule.

---

##### `s3UrlForObject` <a name="s3UrlForObject" id="aws-data-solutions-framework.AccessLogsBucket.s3UrlForObject"></a>

```typescript
public s3UrlForObject(key?: string): string
```

The S3 URL of an S3 object. For example:.

`s3://onlybucket`
- `s3://bucket/key`

###### `key`<sup>Optional</sup> <a name="key" id="aws-data-solutions-framework.AccessLogsBucket.s3UrlForObject.parameter.key"></a>

- *Type:* string

The S3 key of the object.

If not specified, the S3 URL of the
bucket is returned.

---

##### `transferAccelerationUrlForObject` <a name="transferAccelerationUrlForObject" id="aws-data-solutions-framework.AccessLogsBucket.transferAccelerationUrlForObject"></a>

```typescript
public transferAccelerationUrlForObject(key?: string, options?: TransferAccelerationUrlOptions): string
```

The https Transfer Acceleration URL of an S3 object.

Specify `dualStack: true` at the options
for dual-stack endpoint (connect to the bucket over IPv6). For example:

- `https://bucket.s3-accelerate.amazonaws.com`
- `https://bucket.s3-accelerate.amazonaws.com/key`

###### `key`<sup>Optional</sup> <a name="key" id="aws-data-solutions-framework.AccessLogsBucket.transferAccelerationUrlForObject.parameter.key"></a>

- *Type:* string

The S3 key of the object.

If not specified, the URL of the
bucket is returned.

---

###### `options`<sup>Optional</sup> <a name="options" id="aws-data-solutions-framework.AccessLogsBucket.transferAccelerationUrlForObject.parameter.options"></a>

- *Type:* aws-cdk-lib.aws_s3.TransferAccelerationUrlOptions

Options for generating URL.

---

##### `urlForObject` <a name="urlForObject" id="aws-data-solutions-framework.AccessLogsBucket.urlForObject"></a>

```typescript
public urlForObject(key?: string): string
```

The https URL of an S3 object. Specify `regional: false` at the options for non-regional URLs. For example:.

`https://s3.us-west-1.amazonaws.com/onlybucket`
- `https://s3.us-west-1.amazonaws.com/bucket/key`
- `https://s3.cn-north-1.amazonaws.com.cn/china-bucket/mykey`

###### `key`<sup>Optional</sup> <a name="key" id="aws-data-solutions-framework.AccessLogsBucket.urlForObject.parameter.key"></a>

- *Type:* string

The S3 key of the object.

If not specified, the URL of the
bucket is returned.

---

##### `virtualHostedUrlForObject` <a name="virtualHostedUrlForObject" id="aws-data-solutions-framework.AccessLogsBucket.virtualHostedUrlForObject"></a>

```typescript
public virtualHostedUrlForObject(key?: string, options?: VirtualHostedStyleUrlOptions): string
```

The virtual hosted-style URL of an S3 object. Specify `regional: false` at the options for non-regional URL. For example:.

`https://only-bucket.s3.us-west-1.amazonaws.com`
- `https://bucket.s3.us-west-1.amazonaws.com/key`
- `https://bucket.s3.amazonaws.com/key`
- `https://china-bucket.s3.cn-north-1.amazonaws.com.cn/mykey`

###### `key`<sup>Optional</sup> <a name="key" id="aws-data-solutions-framework.AccessLogsBucket.virtualHostedUrlForObject.parameter.key"></a>

- *Type:* string

The S3 key of the object.

If not specified, the URL of the
bucket is returned.

---

###### `options`<sup>Optional</sup> <a name="options" id="aws-data-solutions-framework.AccessLogsBucket.virtualHostedUrlForObject.parameter.options"></a>

- *Type:* aws-cdk-lib.aws_s3.VirtualHostedStyleUrlOptions

Options for generating URL.

---

##### `addCorsRule` <a name="addCorsRule" id="aws-data-solutions-framework.AccessLogsBucket.addCorsRule"></a>

```typescript
public addCorsRule(rule: CorsRule): void
```

Adds a cross-origin access configuration for objects in an Amazon S3 bucket.

###### `rule`<sup>Required</sup> <a name="rule" id="aws-data-solutions-framework.AccessLogsBucket.addCorsRule.parameter.rule"></a>

- *Type:* aws-cdk-lib.aws_s3.CorsRule

The CORS configuration rule to add.

---

##### `addInventory` <a name="addInventory" id="aws-data-solutions-framework.AccessLogsBucket.addInventory"></a>

```typescript
public addInventory(inventory: Inventory): void
```

Add an inventory configuration.

###### `inventory`<sup>Required</sup> <a name="inventory" id="aws-data-solutions-framework.AccessLogsBucket.addInventory.parameter.inventory"></a>

- *Type:* aws-cdk-lib.aws_s3.Inventory

configuration to add.

---

##### `addLifecycleRule` <a name="addLifecycleRule" id="aws-data-solutions-framework.AccessLogsBucket.addLifecycleRule"></a>

```typescript
public addLifecycleRule(rule: LifecycleRule): void
```

Add a lifecycle rule to the bucket.

###### `rule`<sup>Required</sup> <a name="rule" id="aws-data-solutions-framework.AccessLogsBucket.addLifecycleRule.parameter.rule"></a>

- *Type:* aws-cdk-lib.aws_s3.LifecycleRule

The rule to add.

---

##### `addMetric` <a name="addMetric" id="aws-data-solutions-framework.AccessLogsBucket.addMetric"></a>

```typescript
public addMetric(metric: BucketMetrics): void
```

Adds a metrics configuration for the CloudWatch request metrics from the bucket.

###### `metric`<sup>Required</sup> <a name="metric" id="aws-data-solutions-framework.AccessLogsBucket.addMetric.parameter.metric"></a>

- *Type:* aws-cdk-lib.aws_s3.BucketMetrics

The metric configuration to add.

---

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.isOwnedResource">isOwnedResource</a></code> | Returns true if the construct was created by CDK, and false otherwise. |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.isResource">isResource</a></code> | Check whether the given construct is a Resource. |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.fromBucketArn">fromBucketArn</a></code> | *No description.* |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.fromBucketAttributes">fromBucketAttributes</a></code> | Creates a Bucket construct that represents an external bucket. |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.fromBucketName">fromBucketName</a></code> | *No description.* |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.fromCfnBucket">fromCfnBucket</a></code> | Create a mutable `IBucket` based on a low-level `CfnBucket`. |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.validateBucketName">validateBucketName</a></code> | Thrown an exception if the given bucket name is not valid. |

---

##### `isConstruct` <a name="isConstruct" id="aws-data-solutions-framework.AccessLogsBucket.isConstruct"></a>

```typescript
import { AccessLogsBucket } from 'aws-data-solutions-framework'

AccessLogsBucket.isConstruct(x: any)
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

###### `x`<sup>Required</sup> <a name="x" id="aws-data-solutions-framework.AccessLogsBucket.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

##### `isOwnedResource` <a name="isOwnedResource" id="aws-data-solutions-framework.AccessLogsBucket.isOwnedResource"></a>

```typescript
import { AccessLogsBucket } from 'aws-data-solutions-framework'

AccessLogsBucket.isOwnedResource(construct: IConstruct)
```

Returns true if the construct was created by CDK, and false otherwise.

###### `construct`<sup>Required</sup> <a name="construct" id="aws-data-solutions-framework.AccessLogsBucket.isOwnedResource.parameter.construct"></a>

- *Type:* constructs.IConstruct

---

##### `isResource` <a name="isResource" id="aws-data-solutions-framework.AccessLogsBucket.isResource"></a>

```typescript
import { AccessLogsBucket } from 'aws-data-solutions-framework'

AccessLogsBucket.isResource(construct: IConstruct)
```

Check whether the given construct is a Resource.

###### `construct`<sup>Required</sup> <a name="construct" id="aws-data-solutions-framework.AccessLogsBucket.isResource.parameter.construct"></a>

- *Type:* constructs.IConstruct

---

##### `fromBucketArn` <a name="fromBucketArn" id="aws-data-solutions-framework.AccessLogsBucket.fromBucketArn"></a>

```typescript
import { AccessLogsBucket } from 'aws-data-solutions-framework'

AccessLogsBucket.fromBucketArn(scope: Construct, id: string, bucketArn: string)
```

###### `scope`<sup>Required</sup> <a name="scope" id="aws-data-solutions-framework.AccessLogsBucket.fromBucketArn.parameter.scope"></a>

- *Type:* constructs.Construct

---

###### `id`<sup>Required</sup> <a name="id" id="aws-data-solutions-framework.AccessLogsBucket.fromBucketArn.parameter.id"></a>

- *Type:* string

---

###### `bucketArn`<sup>Required</sup> <a name="bucketArn" id="aws-data-solutions-framework.AccessLogsBucket.fromBucketArn.parameter.bucketArn"></a>

- *Type:* string

---

##### `fromBucketAttributes` <a name="fromBucketAttributes" id="aws-data-solutions-framework.AccessLogsBucket.fromBucketAttributes"></a>

```typescript
import { AccessLogsBucket } from 'aws-data-solutions-framework'

AccessLogsBucket.fromBucketAttributes(scope: Construct, id: string, attrs: BucketAttributes)
```

Creates a Bucket construct that represents an external bucket.

###### `scope`<sup>Required</sup> <a name="scope" id="aws-data-solutions-framework.AccessLogsBucket.fromBucketAttributes.parameter.scope"></a>

- *Type:* constructs.Construct

The parent creating construct (usually `this`).

---

###### `id`<sup>Required</sup> <a name="id" id="aws-data-solutions-framework.AccessLogsBucket.fromBucketAttributes.parameter.id"></a>

- *Type:* string

The construct's name.

---

###### `attrs`<sup>Required</sup> <a name="attrs" id="aws-data-solutions-framework.AccessLogsBucket.fromBucketAttributes.parameter.attrs"></a>

- *Type:* aws-cdk-lib.aws_s3.BucketAttributes

A `BucketAttributes` object.

Can be obtained from a call to
`bucket.export()` or manually created.

---

##### `fromBucketName` <a name="fromBucketName" id="aws-data-solutions-framework.AccessLogsBucket.fromBucketName"></a>

```typescript
import { AccessLogsBucket } from 'aws-data-solutions-framework'

AccessLogsBucket.fromBucketName(scope: Construct, id: string, bucketName: string)
```

###### `scope`<sup>Required</sup> <a name="scope" id="aws-data-solutions-framework.AccessLogsBucket.fromBucketName.parameter.scope"></a>

- *Type:* constructs.Construct

---

###### `id`<sup>Required</sup> <a name="id" id="aws-data-solutions-framework.AccessLogsBucket.fromBucketName.parameter.id"></a>

- *Type:* string

---

###### `bucketName`<sup>Required</sup> <a name="bucketName" id="aws-data-solutions-framework.AccessLogsBucket.fromBucketName.parameter.bucketName"></a>

- *Type:* string

---

##### `fromCfnBucket` <a name="fromCfnBucket" id="aws-data-solutions-framework.AccessLogsBucket.fromCfnBucket"></a>

```typescript
import { AccessLogsBucket } from 'aws-data-solutions-framework'

AccessLogsBucket.fromCfnBucket(cfnBucket: CfnBucket)
```

Create a mutable `IBucket` based on a low-level `CfnBucket`.

###### `cfnBucket`<sup>Required</sup> <a name="cfnBucket" id="aws-data-solutions-framework.AccessLogsBucket.fromCfnBucket.parameter.cfnBucket"></a>

- *Type:* aws-cdk-lib.aws_s3.CfnBucket

---

##### `validateBucketName` <a name="validateBucketName" id="aws-data-solutions-framework.AccessLogsBucket.validateBucketName"></a>

```typescript
import { AccessLogsBucket } from 'aws-data-solutions-framework'

AccessLogsBucket.validateBucketName(physicalName: string)
```

Thrown an exception if the given bucket name is not valid.

###### `physicalName`<sup>Required</sup> <a name="physicalName" id="aws-data-solutions-framework.AccessLogsBucket.validateBucketName.parameter.physicalName"></a>

- *Type:* string

name of the bucket.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.property.env">env</a></code> | <code>aws-cdk-lib.ResourceEnvironment</code> | The environment this resource belongs to. |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.property.stack">stack</a></code> | <code>aws-cdk-lib.Stack</code> | The stack in which this resource is defined. |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.property.bucketArn">bucketArn</a></code> | <code>string</code> | The ARN of the bucket. |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.property.bucketDomainName">bucketDomainName</a></code> | <code>string</code> | The IPv4 DNS name of the specified bucket. |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.property.bucketDualStackDomainName">bucketDualStackDomainName</a></code> | <code>string</code> | The IPv6 DNS name of the specified bucket. |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.property.bucketName">bucketName</a></code> | <code>string</code> | The name of the bucket. |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.property.bucketRegionalDomainName">bucketRegionalDomainName</a></code> | <code>string</code> | The regional domain name of the specified bucket. |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.property.bucketWebsiteDomainName">bucketWebsiteDomainName</a></code> | <code>string</code> | The Domain name of the static website. |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.property.bucketWebsiteUrl">bucketWebsiteUrl</a></code> | <code>string</code> | The URL of the static website. |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.property.encryptionKey">encryptionKey</a></code> | <code>aws-cdk-lib.aws_kms.IKey</code> | Optional KMS encryption key associated with this bucket. |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.property.isWebsite">isWebsite</a></code> | <code>boolean</code> | If this bucket has been configured for static website hosting. |
| <code><a href="#aws-data-solutions-framework.AccessLogsBucket.property.policy">policy</a></code> | <code>aws-cdk-lib.aws_s3.BucketPolicy</code> | The resource policy associated with this bucket. |

---

##### `node`<sup>Required</sup> <a name="node" id="aws-data-solutions-framework.AccessLogsBucket.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `env`<sup>Required</sup> <a name="env" id="aws-data-solutions-framework.AccessLogsBucket.property.env"></a>

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

##### `stack`<sup>Required</sup> <a name="stack" id="aws-data-solutions-framework.AccessLogsBucket.property.stack"></a>

```typescript
public readonly stack: Stack;
```

- *Type:* aws-cdk-lib.Stack

The stack in which this resource is defined.

---

##### `bucketArn`<sup>Required</sup> <a name="bucketArn" id="aws-data-solutions-framework.AccessLogsBucket.property.bucketArn"></a>

```typescript
public readonly bucketArn: string;
```

- *Type:* string

The ARN of the bucket.

---

##### `bucketDomainName`<sup>Required</sup> <a name="bucketDomainName" id="aws-data-solutions-framework.AccessLogsBucket.property.bucketDomainName"></a>

```typescript
public readonly bucketDomainName: string;
```

- *Type:* string

The IPv4 DNS name of the specified bucket.

---

##### `bucketDualStackDomainName`<sup>Required</sup> <a name="bucketDualStackDomainName" id="aws-data-solutions-framework.AccessLogsBucket.property.bucketDualStackDomainName"></a>

```typescript
public readonly bucketDualStackDomainName: string;
```

- *Type:* string

The IPv6 DNS name of the specified bucket.

---

##### `bucketName`<sup>Required</sup> <a name="bucketName" id="aws-data-solutions-framework.AccessLogsBucket.property.bucketName"></a>

```typescript
public readonly bucketName: string;
```

- *Type:* string

The name of the bucket.

---

##### `bucketRegionalDomainName`<sup>Required</sup> <a name="bucketRegionalDomainName" id="aws-data-solutions-framework.AccessLogsBucket.property.bucketRegionalDomainName"></a>

```typescript
public readonly bucketRegionalDomainName: string;
```

- *Type:* string

The regional domain name of the specified bucket.

---

##### `bucketWebsiteDomainName`<sup>Required</sup> <a name="bucketWebsiteDomainName" id="aws-data-solutions-framework.AccessLogsBucket.property.bucketWebsiteDomainName"></a>

```typescript
public readonly bucketWebsiteDomainName: string;
```

- *Type:* string

The Domain name of the static website.

---

##### `bucketWebsiteUrl`<sup>Required</sup> <a name="bucketWebsiteUrl" id="aws-data-solutions-framework.AccessLogsBucket.property.bucketWebsiteUrl"></a>

```typescript
public readonly bucketWebsiteUrl: string;
```

- *Type:* string

The URL of the static website.

---

##### `encryptionKey`<sup>Optional</sup> <a name="encryptionKey" id="aws-data-solutions-framework.AccessLogsBucket.property.encryptionKey"></a>

```typescript
public readonly encryptionKey: IKey;
```

- *Type:* aws-cdk-lib.aws_kms.IKey

Optional KMS encryption key associated with this bucket.

---

##### `isWebsite`<sup>Optional</sup> <a name="isWebsite" id="aws-data-solutions-framework.AccessLogsBucket.property.isWebsite"></a>

```typescript
public readonly isWebsite: boolean;
```

- *Type:* boolean

If this bucket has been configured for static website hosting.

---

##### `policy`<sup>Optional</sup> <a name="policy" id="aws-data-solutions-framework.AccessLogsBucket.property.policy"></a>

```typescript
public readonly policy: BucketPolicy;
```

- *Type:* aws-cdk-lib.aws_s3.BucketPolicy

The resource policy associated with this bucket.

If `autoCreatePolicy` is true, a `BucketPolicy` will be created upon the
first call to addToResourcePolicy(s).

---


### AnalyticsBucket <a name="AnalyticsBucket" id="aws-data-solutions-framework.AnalyticsBucket"></a>

An Amazon S3 Bucket configured with best practices and smart defaults for Analytics: * Server side buckets encryption managed by KMS customer key * SSL communication enforcement * Access logged to an S3 bucket within a prefix matching the bucket name * All public access blocked  For custom requirements not covered, consider using {Bucket} directly.

**Usage example**

```typescript
import * as cdk from 'aws-cdk-lib';
import { AnalyticsBucket} from 'aws-data-solutions-framework';

const exampleApp = new cdk.App();
const stack = new cdk.Stack(exampleApp, 'AnalyticsBucketStack');

new AnalyticsBucket(stack, 'MyAnalyticsBucket', {
removalPolicy: cdk.RemovalPolicy.DESTROY,
autoDeleteObjects: true,
});
```

#### Initializers <a name="Initializers" id="aws-data-solutions-framework.AnalyticsBucket.Initializer"></a>

```typescript
import { AnalyticsBucket } from 'aws-data-solutions-framework'

new AnalyticsBucket(scope: Construct, id: string, props?: BucketProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | *No description.* |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.Initializer.parameter.props">props</a></code> | <code>aws-cdk-lib.aws_s3.BucketProps</code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="aws-data-solutions-framework.AnalyticsBucket.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="aws-data-solutions-framework.AnalyticsBucket.Initializer.parameter.id"></a>

- *Type:* string

---

##### `props`<sup>Optional</sup> <a name="props" id="aws-data-solutions-framework.AnalyticsBucket.Initializer.parameter.props"></a>

- *Type:* aws-cdk-lib.aws_s3.BucketProps

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.applyRemovalPolicy">applyRemovalPolicy</a></code> | Apply the given removal policy to this resource. |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.addEventNotification">addEventNotification</a></code> | Adds a bucket notification event destination. |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.addObjectCreatedNotification">addObjectCreatedNotification</a></code> | Subscribes a destination to receive notifications when an object is created in the bucket. |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.addObjectRemovedNotification">addObjectRemovedNotification</a></code> | Subscribes a destination to receive notifications when an object is removed from the bucket. |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.addToResourcePolicy">addToResourcePolicy</a></code> | Adds a statement to the resource policy for a principal (i.e. account/role/service) to perform actions on this bucket and/or its contents. Use `bucketArn` and `arnForObjects(keys)` to obtain ARNs for this bucket or objects. |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.arnForObjects">arnForObjects</a></code> | Returns an ARN that represents all objects within the bucket that match the key pattern specified. |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.enableEventBridgeNotification">enableEventBridgeNotification</a></code> | Enables event bridge notification, causing all events below to be sent to EventBridge:. |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.grantDelete">grantDelete</a></code> | Grants s3:DeleteObject* permission to an IAM principal for objects in this bucket. |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.grantPublicAccess">grantPublicAccess</a></code> | Allows unrestricted access to objects from this bucket. |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.grantPut">grantPut</a></code> | Grants s3:PutObject* and s3:Abort* permissions for this bucket to an IAM principal. |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.grantPutAcl">grantPutAcl</a></code> | Grant the given IAM identity permissions to modify the ACLs of objects in the given Bucket. |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.grantRead">grantRead</a></code> | Grant read permissions for this bucket and it's contents to an IAM principal (Role/Group/User). |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.grantReadWrite">grantReadWrite</a></code> | Grants read/write permissions for this bucket and it's contents to an IAM principal (Role/Group/User). |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.grantWrite">grantWrite</a></code> | Grant write permissions to this bucket to an IAM principal. |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.onCloudTrailEvent">onCloudTrailEvent</a></code> | Define a CloudWatch event that triggers when something happens to this repository. |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.onCloudTrailPutObject">onCloudTrailPutObject</a></code> | Defines an AWS CloudWatch event that triggers when an object is uploaded to the specified paths (keys) in this bucket using the PutObject API call. |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.onCloudTrailWriteObject">onCloudTrailWriteObject</a></code> | Defines an AWS CloudWatch event that triggers when an object at the specified paths (keys) in this bucket are written to. |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.s3UrlForObject">s3UrlForObject</a></code> | The S3 URL of an S3 object. For example:. |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.transferAccelerationUrlForObject">transferAccelerationUrlForObject</a></code> | The https Transfer Acceleration URL of an S3 object. |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.urlForObject">urlForObject</a></code> | The https URL of an S3 object. Specify `regional: false` at the options for non-regional URLs. For example:. |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.virtualHostedUrlForObject">virtualHostedUrlForObject</a></code> | The virtual hosted-style URL of an S3 object. Specify `regional: false` at the options for non-regional URL. For example:. |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.addCorsRule">addCorsRule</a></code> | Adds a cross-origin access configuration for objects in an Amazon S3 bucket. |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.addInventory">addInventory</a></code> | Add an inventory configuration. |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.addLifecycleRule">addLifecycleRule</a></code> | Add a lifecycle rule to the bucket. |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.addMetric">addMetric</a></code> | Adds a metrics configuration for the CloudWatch request metrics from the bucket. |

---

##### `toString` <a name="toString" id="aws-data-solutions-framework.AnalyticsBucket.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `applyRemovalPolicy` <a name="applyRemovalPolicy" id="aws-data-solutions-framework.AnalyticsBucket.applyRemovalPolicy"></a>

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

###### `policy`<sup>Required</sup> <a name="policy" id="aws-data-solutions-framework.AnalyticsBucket.applyRemovalPolicy.parameter.policy"></a>

- *Type:* aws-cdk-lib.RemovalPolicy

---

##### `addEventNotification` <a name="addEventNotification" id="aws-data-solutions-framework.AnalyticsBucket.addEventNotification"></a>

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


###### `event`<sup>Required</sup> <a name="event" id="aws-data-solutions-framework.AnalyticsBucket.addEventNotification.parameter.event"></a>

- *Type:* aws-cdk-lib.aws_s3.EventType

The event to trigger the notification.

---

###### `dest`<sup>Required</sup> <a name="dest" id="aws-data-solutions-framework.AnalyticsBucket.addEventNotification.parameter.dest"></a>

- *Type:* aws-cdk-lib.aws_s3.IBucketNotificationDestination

The notification destination (Lambda, SNS Topic or SQS Queue).

---

###### `filters`<sup>Required</sup> <a name="filters" id="aws-data-solutions-framework.AnalyticsBucket.addEventNotification.parameter.filters"></a>

- *Type:* aws-cdk-lib.aws_s3.NotificationKeyFilter

S3 object key filter rules to determine which objects trigger this event.

Each filter must include a `prefix` and/or `suffix`
that will be matched against the s3 object key. Refer to the S3 Developer Guide
for details about allowed filter rules.

---

##### `addObjectCreatedNotification` <a name="addObjectCreatedNotification" id="aws-data-solutions-framework.AnalyticsBucket.addObjectCreatedNotification"></a>

```typescript
public addObjectCreatedNotification(dest: IBucketNotificationDestination, filters: NotificationKeyFilter): void
```

Subscribes a destination to receive notifications when an object is created in the bucket.

This is identical to calling
`onEvent(EventType.OBJECT_CREATED)`.

###### `dest`<sup>Required</sup> <a name="dest" id="aws-data-solutions-framework.AnalyticsBucket.addObjectCreatedNotification.parameter.dest"></a>

- *Type:* aws-cdk-lib.aws_s3.IBucketNotificationDestination

The notification destination (see onEvent).

---

###### `filters`<sup>Required</sup> <a name="filters" id="aws-data-solutions-framework.AnalyticsBucket.addObjectCreatedNotification.parameter.filters"></a>

- *Type:* aws-cdk-lib.aws_s3.NotificationKeyFilter

Filters (see onEvent).

---

##### `addObjectRemovedNotification` <a name="addObjectRemovedNotification" id="aws-data-solutions-framework.AnalyticsBucket.addObjectRemovedNotification"></a>

```typescript
public addObjectRemovedNotification(dest: IBucketNotificationDestination, filters: NotificationKeyFilter): void
```

Subscribes a destination to receive notifications when an object is removed from the bucket.

This is identical to calling
`onEvent(EventType.OBJECT_REMOVED)`.

###### `dest`<sup>Required</sup> <a name="dest" id="aws-data-solutions-framework.AnalyticsBucket.addObjectRemovedNotification.parameter.dest"></a>

- *Type:* aws-cdk-lib.aws_s3.IBucketNotificationDestination

The notification destination (see onEvent).

---

###### `filters`<sup>Required</sup> <a name="filters" id="aws-data-solutions-framework.AnalyticsBucket.addObjectRemovedNotification.parameter.filters"></a>

- *Type:* aws-cdk-lib.aws_s3.NotificationKeyFilter

Filters (see onEvent).

---

##### `addToResourcePolicy` <a name="addToResourcePolicy" id="aws-data-solutions-framework.AnalyticsBucket.addToResourcePolicy"></a>

```typescript
public addToResourcePolicy(permission: PolicyStatement): AddToResourcePolicyResult
```

Adds a statement to the resource policy for a principal (i.e. account/role/service) to perform actions on this bucket and/or its contents. Use `bucketArn` and `arnForObjects(keys)` to obtain ARNs for this bucket or objects.

Note that the policy statement may or may not be added to the policy.
For example, when an `IBucket` is created from an existing bucket,
it's not possible to tell whether the bucket already has a policy
attached, let alone to re-use that policy to add more statements to it.
So it's safest to do nothing in these cases.

###### `permission`<sup>Required</sup> <a name="permission" id="aws-data-solutions-framework.AnalyticsBucket.addToResourcePolicy.parameter.permission"></a>

- *Type:* aws-cdk-lib.aws_iam.PolicyStatement

the policy statement to be added to the bucket's policy.

---

##### `arnForObjects` <a name="arnForObjects" id="aws-data-solutions-framework.AnalyticsBucket.arnForObjects"></a>

```typescript
public arnForObjects(keyPattern: string): string
```

Returns an ARN that represents all objects within the bucket that match the key pattern specified.

To represent all keys, specify ``"*"``.

If you need to specify a keyPattern with multiple components, concatenate them into a single string, e.g.:

  arnForObjects(`home/${team}/${user}/*`)

###### `keyPattern`<sup>Required</sup> <a name="keyPattern" id="aws-data-solutions-framework.AnalyticsBucket.arnForObjects.parameter.keyPattern"></a>

- *Type:* string

---

##### `enableEventBridgeNotification` <a name="enableEventBridgeNotification" id="aws-data-solutions-framework.AnalyticsBucket.enableEventBridgeNotification"></a>

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

##### `grantDelete` <a name="grantDelete" id="aws-data-solutions-framework.AnalyticsBucket.grantDelete"></a>

```typescript
public grantDelete(identity: IGrantable, objectsKeyPattern?: any): Grant
```

Grants s3:DeleteObject* permission to an IAM principal for objects in this bucket.

###### `identity`<sup>Required</sup> <a name="identity" id="aws-data-solutions-framework.AnalyticsBucket.grantDelete.parameter.identity"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

The principal.

---

###### `objectsKeyPattern`<sup>Optional</sup> <a name="objectsKeyPattern" id="aws-data-solutions-framework.AnalyticsBucket.grantDelete.parameter.objectsKeyPattern"></a>

- *Type:* any

Restrict the permission to a certain key pattern (default '*').

---

##### `grantPublicAccess` <a name="grantPublicAccess" id="aws-data-solutions-framework.AnalyticsBucket.grantPublicAccess"></a>

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

###### `allowedActions`<sup>Required</sup> <a name="allowedActions" id="aws-data-solutions-framework.AnalyticsBucket.grantPublicAccess.parameter.allowedActions"></a>

- *Type:* string

the set of S3 actions to allow.

Default is "s3:GetObject".

---

###### `keyPrefix`<sup>Optional</sup> <a name="keyPrefix" id="aws-data-solutions-framework.AnalyticsBucket.grantPublicAccess.parameter.keyPrefix"></a>

- *Type:* string

the prefix of S3 object keys (e.g. `home/*`). Default is "*".

---

##### `grantPut` <a name="grantPut" id="aws-data-solutions-framework.AnalyticsBucket.grantPut"></a>

```typescript
public grantPut(identity: IGrantable, objectsKeyPattern?: any): Grant
```

Grants s3:PutObject* and s3:Abort* permissions for this bucket to an IAM principal.

If encryption is used, permission to use the key to encrypt the contents
of written files will also be granted to the same principal.

###### `identity`<sup>Required</sup> <a name="identity" id="aws-data-solutions-framework.AnalyticsBucket.grantPut.parameter.identity"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

The principal.

---

###### `objectsKeyPattern`<sup>Optional</sup> <a name="objectsKeyPattern" id="aws-data-solutions-framework.AnalyticsBucket.grantPut.parameter.objectsKeyPattern"></a>

- *Type:* any

Restrict the permission to a certain key pattern (default '*').

---

##### `grantPutAcl` <a name="grantPutAcl" id="aws-data-solutions-framework.AnalyticsBucket.grantPutAcl"></a>

```typescript
public grantPutAcl(identity: IGrantable, objectsKeyPattern?: string): Grant
```

Grant the given IAM identity permissions to modify the ACLs of objects in the given Bucket.

If your application has the '@aws-cdk/aws-s3:grantWriteWithoutAcl' feature flag set,
calling `grantWrite` or `grantReadWrite` no longer grants permissions to modify the ACLs of the objects;
in this case, if you need to modify object ACLs, call this method explicitly.

###### `identity`<sup>Required</sup> <a name="identity" id="aws-data-solutions-framework.AnalyticsBucket.grantPutAcl.parameter.identity"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

---

###### `objectsKeyPattern`<sup>Optional</sup> <a name="objectsKeyPattern" id="aws-data-solutions-framework.AnalyticsBucket.grantPutAcl.parameter.objectsKeyPattern"></a>

- *Type:* string

---

##### `grantRead` <a name="grantRead" id="aws-data-solutions-framework.AnalyticsBucket.grantRead"></a>

```typescript
public grantRead(identity: IGrantable, objectsKeyPattern?: any): Grant
```

Grant read permissions for this bucket and it's contents to an IAM principal (Role/Group/User).

If encryption is used, permission to use the key to decrypt the contents
of the bucket will also be granted to the same principal.

###### `identity`<sup>Required</sup> <a name="identity" id="aws-data-solutions-framework.AnalyticsBucket.grantRead.parameter.identity"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

The principal.

---

###### `objectsKeyPattern`<sup>Optional</sup> <a name="objectsKeyPattern" id="aws-data-solutions-framework.AnalyticsBucket.grantRead.parameter.objectsKeyPattern"></a>

- *Type:* any

Restrict the permission to a certain key pattern (default '*').

---

##### `grantReadWrite` <a name="grantReadWrite" id="aws-data-solutions-framework.AnalyticsBucket.grantReadWrite"></a>

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

###### `identity`<sup>Required</sup> <a name="identity" id="aws-data-solutions-framework.AnalyticsBucket.grantReadWrite.parameter.identity"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

---

###### `objectsKeyPattern`<sup>Optional</sup> <a name="objectsKeyPattern" id="aws-data-solutions-framework.AnalyticsBucket.grantReadWrite.parameter.objectsKeyPattern"></a>

- *Type:* any

---

##### `grantWrite` <a name="grantWrite" id="aws-data-solutions-framework.AnalyticsBucket.grantWrite"></a>

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

###### `identity`<sup>Required</sup> <a name="identity" id="aws-data-solutions-framework.AnalyticsBucket.grantWrite.parameter.identity"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

---

###### `objectsKeyPattern`<sup>Optional</sup> <a name="objectsKeyPattern" id="aws-data-solutions-framework.AnalyticsBucket.grantWrite.parameter.objectsKeyPattern"></a>

- *Type:* any

---

###### `allowedActionPatterns`<sup>Optional</sup> <a name="allowedActionPatterns" id="aws-data-solutions-framework.AnalyticsBucket.grantWrite.parameter.allowedActionPatterns"></a>

- *Type:* string[]

---

##### `onCloudTrailEvent` <a name="onCloudTrailEvent" id="aws-data-solutions-framework.AnalyticsBucket.onCloudTrailEvent"></a>

```typescript
public onCloudTrailEvent(id: string, options?: OnCloudTrailBucketEventOptions): Rule
```

Define a CloudWatch event that triggers when something happens to this repository.

Requires that there exists at least one CloudTrail Trail in your account
that captures the event. This method will not create the Trail.

###### `id`<sup>Required</sup> <a name="id" id="aws-data-solutions-framework.AnalyticsBucket.onCloudTrailEvent.parameter.id"></a>

- *Type:* string

The id of the rule.

---

###### `options`<sup>Optional</sup> <a name="options" id="aws-data-solutions-framework.AnalyticsBucket.onCloudTrailEvent.parameter.options"></a>

- *Type:* aws-cdk-lib.aws_s3.OnCloudTrailBucketEventOptions

Options for adding the rule.

---

##### `onCloudTrailPutObject` <a name="onCloudTrailPutObject" id="aws-data-solutions-framework.AnalyticsBucket.onCloudTrailPutObject"></a>

```typescript
public onCloudTrailPutObject(id: string, options?: OnCloudTrailBucketEventOptions): Rule
```

Defines an AWS CloudWatch event that triggers when an object is uploaded to the specified paths (keys) in this bucket using the PutObject API call.

Note that some tools like `aws s3 cp` will automatically use either
PutObject or the multipart upload API depending on the file size,
so using `onCloudTrailWriteObject` may be preferable.

Requires that there exists at least one CloudTrail Trail in your account
that captures the event. This method will not create the Trail.

###### `id`<sup>Required</sup> <a name="id" id="aws-data-solutions-framework.AnalyticsBucket.onCloudTrailPutObject.parameter.id"></a>

- *Type:* string

The id of the rule.

---

###### `options`<sup>Optional</sup> <a name="options" id="aws-data-solutions-framework.AnalyticsBucket.onCloudTrailPutObject.parameter.options"></a>

- *Type:* aws-cdk-lib.aws_s3.OnCloudTrailBucketEventOptions

Options for adding the rule.

---

##### `onCloudTrailWriteObject` <a name="onCloudTrailWriteObject" id="aws-data-solutions-framework.AnalyticsBucket.onCloudTrailWriteObject"></a>

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

###### `id`<sup>Required</sup> <a name="id" id="aws-data-solutions-framework.AnalyticsBucket.onCloudTrailWriteObject.parameter.id"></a>

- *Type:* string

The id of the rule.

---

###### `options`<sup>Optional</sup> <a name="options" id="aws-data-solutions-framework.AnalyticsBucket.onCloudTrailWriteObject.parameter.options"></a>

- *Type:* aws-cdk-lib.aws_s3.OnCloudTrailBucketEventOptions

Options for adding the rule.

---

##### `s3UrlForObject` <a name="s3UrlForObject" id="aws-data-solutions-framework.AnalyticsBucket.s3UrlForObject"></a>

```typescript
public s3UrlForObject(key?: string): string
```

The S3 URL of an S3 object. For example:.

`s3://onlybucket`
- `s3://bucket/key`

###### `key`<sup>Optional</sup> <a name="key" id="aws-data-solutions-framework.AnalyticsBucket.s3UrlForObject.parameter.key"></a>

- *Type:* string

The S3 key of the object.

If not specified, the S3 URL of the
bucket is returned.

---

##### `transferAccelerationUrlForObject` <a name="transferAccelerationUrlForObject" id="aws-data-solutions-framework.AnalyticsBucket.transferAccelerationUrlForObject"></a>

```typescript
public transferAccelerationUrlForObject(key?: string, options?: TransferAccelerationUrlOptions): string
```

The https Transfer Acceleration URL of an S3 object.

Specify `dualStack: true` at the options
for dual-stack endpoint (connect to the bucket over IPv6). For example:

- `https://bucket.s3-accelerate.amazonaws.com`
- `https://bucket.s3-accelerate.amazonaws.com/key`

###### `key`<sup>Optional</sup> <a name="key" id="aws-data-solutions-framework.AnalyticsBucket.transferAccelerationUrlForObject.parameter.key"></a>

- *Type:* string

The S3 key of the object.

If not specified, the URL of the
bucket is returned.

---

###### `options`<sup>Optional</sup> <a name="options" id="aws-data-solutions-framework.AnalyticsBucket.transferAccelerationUrlForObject.parameter.options"></a>

- *Type:* aws-cdk-lib.aws_s3.TransferAccelerationUrlOptions

Options for generating URL.

---

##### `urlForObject` <a name="urlForObject" id="aws-data-solutions-framework.AnalyticsBucket.urlForObject"></a>

```typescript
public urlForObject(key?: string): string
```

The https URL of an S3 object. Specify `regional: false` at the options for non-regional URLs. For example:.

`https://s3.us-west-1.amazonaws.com/onlybucket`
- `https://s3.us-west-1.amazonaws.com/bucket/key`
- `https://s3.cn-north-1.amazonaws.com.cn/china-bucket/mykey`

###### `key`<sup>Optional</sup> <a name="key" id="aws-data-solutions-framework.AnalyticsBucket.urlForObject.parameter.key"></a>

- *Type:* string

The S3 key of the object.

If not specified, the URL of the
bucket is returned.

---

##### `virtualHostedUrlForObject` <a name="virtualHostedUrlForObject" id="aws-data-solutions-framework.AnalyticsBucket.virtualHostedUrlForObject"></a>

```typescript
public virtualHostedUrlForObject(key?: string, options?: VirtualHostedStyleUrlOptions): string
```

The virtual hosted-style URL of an S3 object. Specify `regional: false` at the options for non-regional URL. For example:.

`https://only-bucket.s3.us-west-1.amazonaws.com`
- `https://bucket.s3.us-west-1.amazonaws.com/key`
- `https://bucket.s3.amazonaws.com/key`
- `https://china-bucket.s3.cn-north-1.amazonaws.com.cn/mykey`

###### `key`<sup>Optional</sup> <a name="key" id="aws-data-solutions-framework.AnalyticsBucket.virtualHostedUrlForObject.parameter.key"></a>

- *Type:* string

The S3 key of the object.

If not specified, the URL of the
bucket is returned.

---

###### `options`<sup>Optional</sup> <a name="options" id="aws-data-solutions-framework.AnalyticsBucket.virtualHostedUrlForObject.parameter.options"></a>

- *Type:* aws-cdk-lib.aws_s3.VirtualHostedStyleUrlOptions

Options for generating URL.

---

##### `addCorsRule` <a name="addCorsRule" id="aws-data-solutions-framework.AnalyticsBucket.addCorsRule"></a>

```typescript
public addCorsRule(rule: CorsRule): void
```

Adds a cross-origin access configuration for objects in an Amazon S3 bucket.

###### `rule`<sup>Required</sup> <a name="rule" id="aws-data-solutions-framework.AnalyticsBucket.addCorsRule.parameter.rule"></a>

- *Type:* aws-cdk-lib.aws_s3.CorsRule

The CORS configuration rule to add.

---

##### `addInventory` <a name="addInventory" id="aws-data-solutions-framework.AnalyticsBucket.addInventory"></a>

```typescript
public addInventory(inventory: Inventory): void
```

Add an inventory configuration.

###### `inventory`<sup>Required</sup> <a name="inventory" id="aws-data-solutions-framework.AnalyticsBucket.addInventory.parameter.inventory"></a>

- *Type:* aws-cdk-lib.aws_s3.Inventory

configuration to add.

---

##### `addLifecycleRule` <a name="addLifecycleRule" id="aws-data-solutions-framework.AnalyticsBucket.addLifecycleRule"></a>

```typescript
public addLifecycleRule(rule: LifecycleRule): void
```

Add a lifecycle rule to the bucket.

###### `rule`<sup>Required</sup> <a name="rule" id="aws-data-solutions-framework.AnalyticsBucket.addLifecycleRule.parameter.rule"></a>

- *Type:* aws-cdk-lib.aws_s3.LifecycleRule

The rule to add.

---

##### `addMetric` <a name="addMetric" id="aws-data-solutions-framework.AnalyticsBucket.addMetric"></a>

```typescript
public addMetric(metric: BucketMetrics): void
```

Adds a metrics configuration for the CloudWatch request metrics from the bucket.

###### `metric`<sup>Required</sup> <a name="metric" id="aws-data-solutions-framework.AnalyticsBucket.addMetric.parameter.metric"></a>

- *Type:* aws-cdk-lib.aws_s3.BucketMetrics

The metric configuration to add.

---

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.isOwnedResource">isOwnedResource</a></code> | Returns true if the construct was created by CDK, and false otherwise. |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.isResource">isResource</a></code> | Check whether the given construct is a Resource. |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.fromBucketArn">fromBucketArn</a></code> | *No description.* |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.fromBucketAttributes">fromBucketAttributes</a></code> | Creates a Bucket construct that represents an external bucket. |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.fromBucketName">fromBucketName</a></code> | *No description.* |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.fromCfnBucket">fromCfnBucket</a></code> | Create a mutable `IBucket` based on a low-level `CfnBucket`. |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.validateBucketName">validateBucketName</a></code> | Thrown an exception if the given bucket name is not valid. |

---

##### `isConstruct` <a name="isConstruct" id="aws-data-solutions-framework.AnalyticsBucket.isConstruct"></a>

```typescript
import { AnalyticsBucket } from 'aws-data-solutions-framework'

AnalyticsBucket.isConstruct(x: any)
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

###### `x`<sup>Required</sup> <a name="x" id="aws-data-solutions-framework.AnalyticsBucket.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

##### `isOwnedResource` <a name="isOwnedResource" id="aws-data-solutions-framework.AnalyticsBucket.isOwnedResource"></a>

```typescript
import { AnalyticsBucket } from 'aws-data-solutions-framework'

AnalyticsBucket.isOwnedResource(construct: IConstruct)
```

Returns true if the construct was created by CDK, and false otherwise.

###### `construct`<sup>Required</sup> <a name="construct" id="aws-data-solutions-framework.AnalyticsBucket.isOwnedResource.parameter.construct"></a>

- *Type:* constructs.IConstruct

---

##### `isResource` <a name="isResource" id="aws-data-solutions-framework.AnalyticsBucket.isResource"></a>

```typescript
import { AnalyticsBucket } from 'aws-data-solutions-framework'

AnalyticsBucket.isResource(construct: IConstruct)
```

Check whether the given construct is a Resource.

###### `construct`<sup>Required</sup> <a name="construct" id="aws-data-solutions-framework.AnalyticsBucket.isResource.parameter.construct"></a>

- *Type:* constructs.IConstruct

---

##### `fromBucketArn` <a name="fromBucketArn" id="aws-data-solutions-framework.AnalyticsBucket.fromBucketArn"></a>

```typescript
import { AnalyticsBucket } from 'aws-data-solutions-framework'

AnalyticsBucket.fromBucketArn(scope: Construct, id: string, bucketArn: string)
```

###### `scope`<sup>Required</sup> <a name="scope" id="aws-data-solutions-framework.AnalyticsBucket.fromBucketArn.parameter.scope"></a>

- *Type:* constructs.Construct

---

###### `id`<sup>Required</sup> <a name="id" id="aws-data-solutions-framework.AnalyticsBucket.fromBucketArn.parameter.id"></a>

- *Type:* string

---

###### `bucketArn`<sup>Required</sup> <a name="bucketArn" id="aws-data-solutions-framework.AnalyticsBucket.fromBucketArn.parameter.bucketArn"></a>

- *Type:* string

---

##### `fromBucketAttributes` <a name="fromBucketAttributes" id="aws-data-solutions-framework.AnalyticsBucket.fromBucketAttributes"></a>

```typescript
import { AnalyticsBucket } from 'aws-data-solutions-framework'

AnalyticsBucket.fromBucketAttributes(scope: Construct, id: string, attrs: BucketAttributes)
```

Creates a Bucket construct that represents an external bucket.

###### `scope`<sup>Required</sup> <a name="scope" id="aws-data-solutions-framework.AnalyticsBucket.fromBucketAttributes.parameter.scope"></a>

- *Type:* constructs.Construct

The parent creating construct (usually `this`).

---

###### `id`<sup>Required</sup> <a name="id" id="aws-data-solutions-framework.AnalyticsBucket.fromBucketAttributes.parameter.id"></a>

- *Type:* string

The construct's name.

---

###### `attrs`<sup>Required</sup> <a name="attrs" id="aws-data-solutions-framework.AnalyticsBucket.fromBucketAttributes.parameter.attrs"></a>

- *Type:* aws-cdk-lib.aws_s3.BucketAttributes

A `BucketAttributes` object.

Can be obtained from a call to
`bucket.export()` or manually created.

---

##### `fromBucketName` <a name="fromBucketName" id="aws-data-solutions-framework.AnalyticsBucket.fromBucketName"></a>

```typescript
import { AnalyticsBucket } from 'aws-data-solutions-framework'

AnalyticsBucket.fromBucketName(scope: Construct, id: string, bucketName: string)
```

###### `scope`<sup>Required</sup> <a name="scope" id="aws-data-solutions-framework.AnalyticsBucket.fromBucketName.parameter.scope"></a>

- *Type:* constructs.Construct

---

###### `id`<sup>Required</sup> <a name="id" id="aws-data-solutions-framework.AnalyticsBucket.fromBucketName.parameter.id"></a>

- *Type:* string

---

###### `bucketName`<sup>Required</sup> <a name="bucketName" id="aws-data-solutions-framework.AnalyticsBucket.fromBucketName.parameter.bucketName"></a>

- *Type:* string

---

##### `fromCfnBucket` <a name="fromCfnBucket" id="aws-data-solutions-framework.AnalyticsBucket.fromCfnBucket"></a>

```typescript
import { AnalyticsBucket } from 'aws-data-solutions-framework'

AnalyticsBucket.fromCfnBucket(cfnBucket: CfnBucket)
```

Create a mutable `IBucket` based on a low-level `CfnBucket`.

###### `cfnBucket`<sup>Required</sup> <a name="cfnBucket" id="aws-data-solutions-framework.AnalyticsBucket.fromCfnBucket.parameter.cfnBucket"></a>

- *Type:* aws-cdk-lib.aws_s3.CfnBucket

---

##### `validateBucketName` <a name="validateBucketName" id="aws-data-solutions-framework.AnalyticsBucket.validateBucketName"></a>

```typescript
import { AnalyticsBucket } from 'aws-data-solutions-framework'

AnalyticsBucket.validateBucketName(physicalName: string)
```

Thrown an exception if the given bucket name is not valid.

###### `physicalName`<sup>Required</sup> <a name="physicalName" id="aws-data-solutions-framework.AnalyticsBucket.validateBucketName.parameter.physicalName"></a>

- *Type:* string

name of the bucket.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.property.env">env</a></code> | <code>aws-cdk-lib.ResourceEnvironment</code> | The environment this resource belongs to. |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.property.stack">stack</a></code> | <code>aws-cdk-lib.Stack</code> | The stack in which this resource is defined. |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.property.bucketArn">bucketArn</a></code> | <code>string</code> | The ARN of the bucket. |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.property.bucketDomainName">bucketDomainName</a></code> | <code>string</code> | The IPv4 DNS name of the specified bucket. |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.property.bucketDualStackDomainName">bucketDualStackDomainName</a></code> | <code>string</code> | The IPv6 DNS name of the specified bucket. |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.property.bucketName">bucketName</a></code> | <code>string</code> | The name of the bucket. |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.property.bucketRegionalDomainName">bucketRegionalDomainName</a></code> | <code>string</code> | The regional domain name of the specified bucket. |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.property.bucketWebsiteDomainName">bucketWebsiteDomainName</a></code> | <code>string</code> | The Domain name of the static website. |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.property.bucketWebsiteUrl">bucketWebsiteUrl</a></code> | <code>string</code> | The URL of the static website. |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.property.encryptionKey">encryptionKey</a></code> | <code>aws-cdk-lib.aws_kms.IKey</code> | Optional KMS encryption key associated with this bucket. |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.property.isWebsite">isWebsite</a></code> | <code>boolean</code> | If this bucket has been configured for static website hosting. |
| <code><a href="#aws-data-solutions-framework.AnalyticsBucket.property.policy">policy</a></code> | <code>aws-cdk-lib.aws_s3.BucketPolicy</code> | The resource policy associated with this bucket. |

---

##### `node`<sup>Required</sup> <a name="node" id="aws-data-solutions-framework.AnalyticsBucket.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `env`<sup>Required</sup> <a name="env" id="aws-data-solutions-framework.AnalyticsBucket.property.env"></a>

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

##### `stack`<sup>Required</sup> <a name="stack" id="aws-data-solutions-framework.AnalyticsBucket.property.stack"></a>

```typescript
public readonly stack: Stack;
```

- *Type:* aws-cdk-lib.Stack

The stack in which this resource is defined.

---

##### `bucketArn`<sup>Required</sup> <a name="bucketArn" id="aws-data-solutions-framework.AnalyticsBucket.property.bucketArn"></a>

```typescript
public readonly bucketArn: string;
```

- *Type:* string

The ARN of the bucket.

---

##### `bucketDomainName`<sup>Required</sup> <a name="bucketDomainName" id="aws-data-solutions-framework.AnalyticsBucket.property.bucketDomainName"></a>

```typescript
public readonly bucketDomainName: string;
```

- *Type:* string

The IPv4 DNS name of the specified bucket.

---

##### `bucketDualStackDomainName`<sup>Required</sup> <a name="bucketDualStackDomainName" id="aws-data-solutions-framework.AnalyticsBucket.property.bucketDualStackDomainName"></a>

```typescript
public readonly bucketDualStackDomainName: string;
```

- *Type:* string

The IPv6 DNS name of the specified bucket.

---

##### `bucketName`<sup>Required</sup> <a name="bucketName" id="aws-data-solutions-framework.AnalyticsBucket.property.bucketName"></a>

```typescript
public readonly bucketName: string;
```

- *Type:* string

The name of the bucket.

---

##### `bucketRegionalDomainName`<sup>Required</sup> <a name="bucketRegionalDomainName" id="aws-data-solutions-framework.AnalyticsBucket.property.bucketRegionalDomainName"></a>

```typescript
public readonly bucketRegionalDomainName: string;
```

- *Type:* string

The regional domain name of the specified bucket.

---

##### `bucketWebsiteDomainName`<sup>Required</sup> <a name="bucketWebsiteDomainName" id="aws-data-solutions-framework.AnalyticsBucket.property.bucketWebsiteDomainName"></a>

```typescript
public readonly bucketWebsiteDomainName: string;
```

- *Type:* string

The Domain name of the static website.

---

##### `bucketWebsiteUrl`<sup>Required</sup> <a name="bucketWebsiteUrl" id="aws-data-solutions-framework.AnalyticsBucket.property.bucketWebsiteUrl"></a>

```typescript
public readonly bucketWebsiteUrl: string;
```

- *Type:* string

The URL of the static website.

---

##### `encryptionKey`<sup>Optional</sup> <a name="encryptionKey" id="aws-data-solutions-framework.AnalyticsBucket.property.encryptionKey"></a>

```typescript
public readonly encryptionKey: IKey;
```

- *Type:* aws-cdk-lib.aws_kms.IKey

Optional KMS encryption key associated with this bucket.

---

##### `isWebsite`<sup>Optional</sup> <a name="isWebsite" id="aws-data-solutions-framework.AnalyticsBucket.property.isWebsite"></a>

```typescript
public readonly isWebsite: boolean;
```

- *Type:* boolean

If this bucket has been configured for static website hosting.

---

##### `policy`<sup>Optional</sup> <a name="policy" id="aws-data-solutions-framework.AnalyticsBucket.property.policy"></a>

```typescript
public readonly policy: BucketPolicy;
```

- *Type:* aws-cdk-lib.aws_s3.BucketPolicy

The resource policy associated with this bucket.

If `autoCreatePolicy` is true, a `BucketPolicy` will be created upon the
first call to addToResourcePolicy(s).

---


### ApplicationStage <a name="ApplicationStage" id="@adsf/framework.ApplicationStage"></a>

ApplicationStage class that creates a CDK Pipelines Stage from an ApplicationStackFactory.

#### Initializers <a name="Initializers" id="@adsf/framework.ApplicationStage.Initializer"></a>

```typescript
import { ApplicationStage } from '@adsf/framework'

new ApplicationStage(scope: Construct, id: string, props: ApplicationStageProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@adsf/framework.ApplicationStage.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | the Scope of the CDK Construct. |
| <code><a href="#@adsf/framework.ApplicationStage.Initializer.parameter.id">id</a></code> | <code>string</code> | the ID of the CDK Construct. |
| <code><a href="#@adsf/framework.ApplicationStage.Initializer.parameter.props">props</a></code> | <code><a href="#@adsf/framework.ApplicationStageProps">ApplicationStageProps</a></code> | the SparkCICDStageProps properties. |

---

##### `scope`<sup>Required</sup> <a name="scope" id="@adsf/framework.ApplicationStage.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

the Scope of the CDK Construct.

---

##### `id`<sup>Required</sup> <a name="id" id="@adsf/framework.ApplicationStage.Initializer.parameter.id"></a>

- *Type:* string

the ID of the CDK Construct.

---

##### `props`<sup>Required</sup> <a name="props" id="@adsf/framework.ApplicationStage.Initializer.parameter.props"></a>

- *Type:* <a href="#@adsf/framework.ApplicationStageProps">ApplicationStageProps</a>

the SparkCICDStageProps properties.

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#@adsf/framework.ApplicationStage.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#@adsf/framework.ApplicationStage.synth">synth</a></code> | Synthesize this stage into a cloud assembly. |

---

##### `toString` <a name="toString" id="@adsf/framework.ApplicationStage.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `synth` <a name="synth" id="@adsf/framework.ApplicationStage.synth"></a>

```typescript
public synth(options?: StageSynthesisOptions): CloudAssembly
```

Synthesize this stage into a cloud assembly.

Once an assembly has been synthesized, it cannot be modified. Subsequent
calls will return the same assembly.

###### `options`<sup>Optional</sup> <a name="options" id="@adsf/framework.ApplicationStage.synth.parameter.options"></a>

- *Type:* aws-cdk-lib.StageSynthesisOptions

---

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#@adsf/framework.ApplicationStage.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |
| <code><a href="#@adsf/framework.ApplicationStage.isStage">isStage</a></code> | Test whether the given construct is a stage. |
| <code><a href="#@adsf/framework.ApplicationStage.of">of</a></code> | Return the stage this construct is contained with, if available. |

---

##### `isConstruct` <a name="isConstruct" id="@adsf/framework.ApplicationStage.isConstruct"></a>

```typescript
import { ApplicationStage } from '@adsf/framework'

ApplicationStage.isConstruct(x: any)
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

###### `x`<sup>Required</sup> <a name="x" id="@adsf/framework.ApplicationStage.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

##### `isStage` <a name="isStage" id="@adsf/framework.ApplicationStage.isStage"></a>

```typescript
import { ApplicationStage } from '@adsf/framework'

ApplicationStage.isStage(x: any)
```

Test whether the given construct is a stage.

###### `x`<sup>Required</sup> <a name="x" id="@adsf/framework.ApplicationStage.isStage.parameter.x"></a>

- *Type:* any

---

##### `of` <a name="of" id="@adsf/framework.ApplicationStage.of"></a>

```typescript
import { ApplicationStage } from '@adsf/framework'

ApplicationStage.of(construct: IConstruct)
```

Return the stage this construct is contained with, if available.

If called
on a nested stage, returns its parent.

###### `construct`<sup>Required</sup> <a name="construct" id="@adsf/framework.ApplicationStage.of.parameter.construct"></a>

- *Type:* constructs.IConstruct

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@adsf/framework.ApplicationStage.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#@adsf/framework.ApplicationStage.property.artifactId">artifactId</a></code> | <code>string</code> | Artifact ID of the assembly if it is a nested stage. The root stage (app) will return an empty string. |
| <code><a href="#@adsf/framework.ApplicationStage.property.assetOutdir">assetOutdir</a></code> | <code>string</code> | The cloud assembly asset output directory. |
| <code><a href="#@adsf/framework.ApplicationStage.property.outdir">outdir</a></code> | <code>string</code> | The cloud assembly output directory. |
| <code><a href="#@adsf/framework.ApplicationStage.property.policyValidationBeta1">policyValidationBeta1</a></code> | <code>aws-cdk-lib.IPolicyValidationPluginBeta1[]</code> | Validation plugins to run during synthesis. |
| <code><a href="#@adsf/framework.ApplicationStage.property.stageName">stageName</a></code> | <code>string</code> | The name of the stage. |
| <code><a href="#@adsf/framework.ApplicationStage.property.account">account</a></code> | <code>string</code> | The default account for all resources defined within this stage. |
| <code><a href="#@adsf/framework.ApplicationStage.property.parentStage">parentStage</a></code> | <code>aws-cdk-lib.Stage</code> | The parent stage or `undefined` if this is the app. |
| <code><a href="#@adsf/framework.ApplicationStage.property.region">region</a></code> | <code>string</code> | The default region for all resources defined within this stage. |
| <code><a href="#@adsf/framework.ApplicationStage.property.stackOutputsEnv">stackOutputsEnv</a></code> | <code>{[ key: string ]: aws-cdk-lib.CfnOutput}</code> | The list of CfnOutputs created by the CDK Stack. |

---

##### `node`<sup>Required</sup> <a name="node" id="@adsf/framework.ApplicationStage.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `artifactId`<sup>Required</sup> <a name="artifactId" id="@adsf/framework.ApplicationStage.property.artifactId"></a>

```typescript
public readonly artifactId: string;
```

- *Type:* string

Artifact ID of the assembly if it is a nested stage. The root stage (app) will return an empty string.

Derived from the construct path.

---

##### `assetOutdir`<sup>Required</sup> <a name="assetOutdir" id="@adsf/framework.ApplicationStage.property.assetOutdir"></a>

```typescript
public readonly assetOutdir: string;
```

- *Type:* string

The cloud assembly asset output directory.

---

##### `outdir`<sup>Required</sup> <a name="outdir" id="@adsf/framework.ApplicationStage.property.outdir"></a>

```typescript
public readonly outdir: string;
```

- *Type:* string

The cloud assembly output directory.

---

##### `policyValidationBeta1`<sup>Required</sup> <a name="policyValidationBeta1" id="@adsf/framework.ApplicationStage.property.policyValidationBeta1"></a>

```typescript
public readonly policyValidationBeta1: IPolicyValidationPluginBeta1[];
```

- *Type:* aws-cdk-lib.IPolicyValidationPluginBeta1[]
- *Default:* no validation plugins are used

Validation plugins to run during synthesis.

If any plugin reports any violation,
synthesis will be interrupted and the report displayed to the user.

---

##### `stageName`<sup>Required</sup> <a name="stageName" id="@adsf/framework.ApplicationStage.property.stageName"></a>

```typescript
public readonly stageName: string;
```

- *Type:* string

The name of the stage.

Based on names of the parent stages separated by
hypens.

---

##### `account`<sup>Optional</sup> <a name="account" id="@adsf/framework.ApplicationStage.property.account"></a>

```typescript
public readonly account: string;
```

- *Type:* string

The default account for all resources defined within this stage.

---

##### `parentStage`<sup>Optional</sup> <a name="parentStage" id="@adsf/framework.ApplicationStage.property.parentStage"></a>

```typescript
public readonly parentStage: Stage;
```

- *Type:* aws-cdk-lib.Stage

The parent stage or `undefined` if this is the app.

*

---

##### `region`<sup>Optional</sup> <a name="region" id="@adsf/framework.ApplicationStage.property.region"></a>

```typescript
public readonly region: string;
```

- *Type:* string

The default region for all resources defined within this stage.

---

##### `stackOutputsEnv`<sup>Optional</sup> <a name="stackOutputsEnv" id="@adsf/framework.ApplicationStage.property.stackOutputsEnv"></a>

```typescript
public readonly stackOutputsEnv: {[ key: string ]: CfnOutput};
```

- *Type:* {[ key: string ]: aws-cdk-lib.CfnOutput}

The list of CfnOutputs created by the CDK Stack.

---


### DataCatalogDatabase <a name="DataCatalogDatabase" id="@adsf/framework.DataCatalogDatabase"></a>

An AWS Glue Data Catalog Database configured with the location and a crawler.

*Example*

```typescript
import * as cdk from 'aws-cdk-lib';
import { DataCatalogDatabase } from 'aws-data-solutions-framework';

const exampleApp = new cdk.App();
const stack = new cdk.Stack(exampleApp, 'DataCatalogStack');

new DataCatalogDatabase(stack, 'ExampleDatabase', {
   locationBucket: bucket,
   locationPrefix: '/databasePath',
   name: 'example-db'
});
```


#### Initializers <a name="Initializers" id="@adsf/framework.DataCatalogDatabase.Initializer"></a>

```typescript
import { DataCatalogDatabase } from '@adsf/framework'

new DataCatalogDatabase(scope: Construct, id: string, props: DataCatalogDatabaseProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@adsf/framework.DataCatalogDatabase.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | *No description.* |
| <code><a href="#@adsf/framework.DataCatalogDatabase.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#@adsf/framework.DataCatalogDatabase.Initializer.parameter.props">props</a></code> | <code><a href="#@adsf/framework.DataCatalogDatabaseProps">DataCatalogDatabaseProps</a></code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="@adsf/framework.DataCatalogDatabase.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="@adsf/framework.DataCatalogDatabase.Initializer.parameter.id"></a>

- *Type:* string

---

##### `props`<sup>Required</sup> <a name="props" id="@adsf/framework.DataCatalogDatabase.Initializer.parameter.props"></a>

- *Type:* <a href="#@adsf/framework.DataCatalogDatabaseProps">DataCatalogDatabaseProps</a>

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#@adsf/framework.DataCatalogDatabase.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#@adsf/framework.DataCatalogDatabase.grantReadOnlyAccess">grantReadOnlyAccess</a></code> | Grants read access via identity based policy to the principal. |

---

##### `toString` <a name="toString" id="@adsf/framework.DataCatalogDatabase.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `grantReadOnlyAccess` <a name="grantReadOnlyAccess" id="@adsf/framework.DataCatalogDatabase.grantReadOnlyAccess"></a>

```typescript
public grantReadOnlyAccess(principal: IPrincipal): AddToPrincipalPolicyResult
```

Grants read access via identity based policy to the principal.

This would attach an IAM policy to the principal allowing read access to the database and all its tables.

###### `principal`<sup>Required</sup> <a name="principal" id="@adsf/framework.DataCatalogDatabase.grantReadOnlyAccess.parameter.principal"></a>

- *Type:* aws-cdk-lib.aws_iam.IPrincipal

Principal to attach the database read access to.

---

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#@adsf/framework.DataCatalogDatabase.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |

---

##### `isConstruct` <a name="isConstruct" id="@adsf/framework.DataCatalogDatabase.isConstruct"></a>

```typescript
import { DataCatalogDatabase } from '@adsf/framework'

DataCatalogDatabase.isConstruct(x: any)
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

###### `x`<sup>Required</sup> <a name="x" id="@adsf/framework.DataCatalogDatabase.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@adsf/framework.DataCatalogDatabase.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#@adsf/framework.DataCatalogDatabase.property.database">database</a></code> | <code>aws-cdk-lib.aws_glue.CfnDatabase</code> | The Glue database that's created. |
| <code><a href="#@adsf/framework.DataCatalogDatabase.property.databaseName">databaseName</a></code> | <code>string</code> | The Glue database name with the randomized suffix to prevent name collisions in the catalog. |
| <code><a href="#@adsf/framework.DataCatalogDatabase.property.crawler">crawler</a></code> | <code>aws-cdk-lib.aws_glue.CfnCrawler</code> | The Glue Crawler that is automatically created when `autoCrawl` is set to `true` (default value). |
| <code><a href="#@adsf/framework.DataCatalogDatabase.property.crawlerLogEncryptionKey">crawlerLogEncryptionKey</a></code> | <code>aws-cdk-lib.aws_kms.Key</code> | KMS encryption key used by the Crawler. |

---

##### `node`<sup>Required</sup> <a name="node" id="@adsf/framework.DataCatalogDatabase.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `database`<sup>Required</sup> <a name="database" id="@adsf/framework.DataCatalogDatabase.property.database"></a>

```typescript
public readonly database: CfnDatabase;
```

- *Type:* aws-cdk-lib.aws_glue.CfnDatabase

The Glue database that's created.

---

##### `databaseName`<sup>Required</sup> <a name="databaseName" id="@adsf/framework.DataCatalogDatabase.property.databaseName"></a>

```typescript
public readonly databaseName: string;
```

- *Type:* string

The Glue database name with the randomized suffix to prevent name collisions in the catalog.

---

##### `crawler`<sup>Optional</sup> <a name="crawler" id="@adsf/framework.DataCatalogDatabase.property.crawler"></a>

```typescript
public readonly crawler: CfnCrawler;
```

- *Type:* aws-cdk-lib.aws_glue.CfnCrawler

The Glue Crawler that is automatically created when `autoCrawl` is set to `true` (default value).

This property can be undefined if `autoCrawl` is set to `false`.

---

##### `crawlerLogEncryptionKey`<sup>Optional</sup> <a name="crawlerLogEncryptionKey" id="@adsf/framework.DataCatalogDatabase.property.crawlerLogEncryptionKey"></a>

```typescript
public readonly crawlerLogEncryptionKey: Key;
```

- *Type:* aws-cdk-lib.aws_kms.Key

KMS encryption key used by the Crawler.

---

#### Constants <a name="Constants" id="Constants"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#framework.DataCatalogDatabase.property.ADSF_OWNED_TAG">ADSF_OWNED_TAG</a></code> | <code>string</code> | *No description.* |
| <code><a href="#framework.DataCatalogDatabase.property.ADSF_TRACKING_CODE">ADSF_TRACKING_CODE</a></code> | <code>string</code> | *No description.* |

---

##### `ADSF_OWNED_TAG`<sup>Required</sup> <a name="ADSF_OWNED_TAG" id="framework.DataCatalogDatabase.property.ADSF_OWNED_TAG"></a>

```typescript
public readonly ADSF_OWNED_TAG: string;
```

- *Type:* string

---

##### `ADSF_TRACKING_CODE`<sup>Required</sup> <a name="ADSF_TRACKING_CODE" id="framework.DataCatalogDatabase.property.ADSF_TRACKING_CODE"></a>

```typescript
public readonly ADSF_TRACKING_CODE: string;
```

- *Type:* string

---

### DataLakeCatalog <a name="DataLakeCatalog" id="@adsf/framework.DataLakeCatalog"></a>

Creates AWS Glue Catalog Database for each storage layer.

Composed of 3 {@link DataCatalogDatabase} for Bronze, Silver, and Gold data.

*Example*

```typescript
import * as cdk from 'aws-cdk-lib';
import { Key } from 'aws-cdk-lib/aws-kms';
import { DataLakeCatalog, DataLakeStorage } from 'aws-data-solutions-framework';

const exampleApp = new cdk.App();
const stack = new cdk.Stack(exampleApp, 'DataLakeStorageStack');

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
 removalPolicy: cdk.RemovalPolicy.DESTROY,
 dataLakeKey: new Key(stack, 'MyDataLakeKey')
});
```

#### Initializers <a name="Initializers" id="aws-data-solutions-framework.DataLakeStorage.Initializer"></a>

```typescript
import { DataLakeStorage } from 'aws-data-solutions-framework'

new DataLakeCatalog(scope: Construct, id: string, props: DataLakeCatalogProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-data-solutions-framework.DataLakeStorage.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | the Scope of the CDK Construct. |
| <code><a href="#aws-data-solutions-framework.DataLakeStorage.Initializer.parameter.id">id</a></code> | <code>string</code> | the ID of the CDK Construct. |
| <code><a href="#aws-data-solutions-framework.DataLakeStorage.Initializer.parameter.props">props</a></code> | <code><a href="#aws-data-solutions-framework.DataLakeStorageProps">DataLakeStorageProps</a></code> | the DataLakeStorageProps properties. |

---

##### `scope`<sup>Required</sup> <a name="scope" id="aws-data-solutions-framework.DataLakeStorage.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

the Scope of the CDK Construct.

---

##### `id`<sup>Required</sup> <a name="id" id="aws-data-solutions-framework.DataLakeStorage.Initializer.parameter.id"></a>

- *Type:* string

the ID of the CDK Construct.

---

##### `props`<sup>Optional</sup> <a name="props" id="aws-data-solutions-framework.DataLakeStorage.Initializer.parameter.props"></a>

- *Type:* <a href="#aws-data-solutions-framework.DataLakeStorageProps">DataLakeStorageProps</a>

the DataLakeCatalog properties.

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-data-solutions-framework.DataLakeStorage.toString">toString</a></code> | Returns a string representation of this construct. |

---

##### `toString` <a name="toString" id="aws-data-solutions-framework.DataLakeStorage.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#aws-data-solutions-framework.DataLakeStorage.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |

---

##### `isConstruct` <a name="isConstruct" id="aws-data-solutions-framework.DataLakeStorage.isConstruct"></a>

```typescript
import { DataLakeStorage } from 'aws-data-solutions-framework'

DataLakeStorage.isConstruct(x: any)
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

###### `x`<sup>Required</sup> <a name="x" id="aws-data-solutions-framework.DataLakeStorage.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-data-solutions-framework.DataLakeStorage.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#aws-data-solutions-framework.DataLakeStorage.property.accessLogsBucket">accessLogsBucket</a></code> | <code><a href="#aws-data-solutions-framework.AccessLogsBucket">AccessLogsBucket</a></code> | *No description.* |
| <code><a href="#aws-data-solutions-framework.DataLakeStorage.property.bronzeBucket">bronzeBucket</a></code> | <code><a href="#aws-data-solutions-framework.AnalyticsBucket">AnalyticsBucket</a></code> | *No description.* |
| <code><a href="#aws-data-solutions-framework.DataLakeStorage.property.dataLakeKey">dataLakeKey</a></code> | <code>aws-cdk-lib.aws_kms.Key</code> | *No description.* |
| <code><a href="#aws-data-solutions-framework.DataLakeStorage.property.goldBucket">goldBucket</a></code> | <code><a href="#aws-data-solutions-framework.AnalyticsBucket">AnalyticsBucket</a></code> | *No description.* |
| <code><a href="#aws-data-solutions-framework.DataLakeStorage.property.silverBucket">silverBucket</a></code> | <code><a href="#aws-data-solutions-framework.AnalyticsBucket">AnalyticsBucket</a></code> | *No description.* |

---

##### `node`<sup>Required</sup> <a name="node" id="aws-data-solutions-framework.DataLakeStorage.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `accessLogsBucket`<sup>Required</sup> <a name="accessLogsBucket" id="aws-data-solutions-framework.DataLakeStorage.property.accessLogsBucket"></a>

```typescript
public readonly accessLogsBucket: AccessLogsBucket;
```

- *Type:* <a href="#aws-data-solutions-framework.AccessLogsBucket">AccessLogsBucket</a>

---

##### `bronzeBucket`<sup>Required</sup> <a name="bronzeBucket" id="aws-data-solutions-framework.DataLakeStorage.property.bronzeBucket"></a>

```typescript
public readonly bronzeBucket: AnalyticsBucket;
```

- *Type:* <a href="#aws-data-solutions-framework.AnalyticsBucket">AnalyticsBucket</a>

---

##### `dataLakeKey`<sup>Required</sup> <a name="dataLakeKey" id="aws-data-solutions-framework.DataLakeStorage.property.dataLakeKey"></a>

```typescript
public readonly dataLakeKey: Key;
```

- *Type:* aws-cdk-lib.aws_kms.Key

---

##### `goldBucket`<sup>Required</sup> <a name="goldBucket" id="aws-data-solutions-framework.DataLakeStorage.property.goldBucket"></a>

```typescript
public readonly goldBucket: AnalyticsBucket;
```

- *Type:* <a href="#aws-data-solutions-framework.AnalyticsBucket">AnalyticsBucket</a>

---

##### `silverBucket`<sup>Required</sup> <a name="silverBucket" id="aws-data-solutions-framework.DataLakeStorage.property.silverBucket"></a>

```typescript
public readonly silverBucket: AnalyticsBucket;
```

- *Type:* <a href="#@adsf/framework.AnalyticsBucket">AnalyticsBucket</a>

---

#### Constants <a name="Constants" id="Constants"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#framework.DataLakeStorage.property.ADSF_OWNED_TAG">ADSF_OWNED_TAG</a></code> | <code>string</code> | *No description.* |
| <code><a href="#framework.DataLakeStorage.property.ADSF_TRACKING_CODE">ADSF_TRACKING_CODE</a></code> | <code>string</code> | *No description.* |

---

##### `ADSF_OWNED_TAG`<sup>Required</sup> <a name="ADSF_OWNED_TAG" id="framework.DataLakeStorage.property.ADSF_OWNED_TAG"></a>

```typescript
public readonly ADSF_OWNED_TAG: string;
```

- *Type:* string

---

##### `ADSF_TRACKING_CODE`<sup>Required</sup> <a name="ADSF_TRACKING_CODE" id="framework.DataLakeStorage.property.ADSF_TRACKING_CODE"></a>

```typescript
public readonly ADSF_TRACKING_CODE: string;
```

- *Type:* string

---

### SparkEmrCICDPipeline <a name="SparkEmrCICDPipeline" id="@adsf/framework.SparkEmrCICDPipeline"></a>

A CICD Pipeline that tests and deploys a Spark application in cross-account environments using CDK Pipelines.

*Example*

```typescript
const stack = new Stack();

interface MyApplicationStackProps extends StackProps {
  readonly stage: CICDStage;
}

class MyApplicationStack extends Stack {
  constructor(scope: Stack, props?: MyApplicationStackProps) {
    super(scope, 'MyApplicationStack');
*     const bucket = new Bucket(this, 'TestBucket', {
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    new CfnOutput(this, 'BucketName', { value: bucket.bucketName });
  }
}

class MyStackFactory implements ApplicationStackFactory {
  createStack(scope: Stack, stage: CICDStage): Stack {
    return new MyApplicationStack(scope, { stage });
  }
}

new SparkCICDPipeline(stack, 'TestConstruct', {
  applicationName: 'test',
  applicationStackFactory: new MyStackFactory(),
  cdkApplicationPath: 'cdk/',
  sparkApplicationPath: 'spark/',
  sparkImage: SparkImage.EMR_SERVERLESS_6_10,
  integTestScript: 'cdk/integ-test.sh',
  integTestEnv: {
    TEST_BUCKET: 'BucketName',
  },
});
```


#### Initializers <a name="Initializers" id="@adsf/framework.SparkEmrCICDPipeline.Initializer"></a>

```typescript
import { SparkEmrCICDPipeline } from '@adsf/framework'

new SparkEmrCICDPipeline(scope: Construct, id: string, props: SparkEmrCICDPipelineProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@adsf/framework.SparkEmrCICDPipeline.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | the Scope of the CDK Construct. |
| <code><a href="#@adsf/framework.SparkEmrCICDPipeline.Initializer.parameter.id">id</a></code> | <code>string</code> | the ID of the CDK Construct. |
| <code><a href="#@adsf/framework.SparkEmrCICDPipeline.Initializer.parameter.props">props</a></code> | <code><a href="#@adsf/framework.SparkEmrCICDPipelineProps">SparkEmrCICDPipelineProps</a></code> | the SparkCICDPipelineProps properties. |

---

##### `scope`<sup>Required</sup> <a name="scope" id="@adsf/framework.SparkEmrCICDPipeline.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

the Scope of the CDK Construct.

---

##### `id`<sup>Required</sup> <a name="id" id="@adsf/framework.SparkEmrCICDPipeline.Initializer.parameter.id"></a>

- *Type:* string

the ID of the CDK Construct.

---

##### `props`<sup>Required</sup> <a name="props" id="@adsf/framework.SparkEmrCICDPipeline.Initializer.parameter.props"></a>

- *Type:* <a href="#@adsf/framework.SparkEmrCICDPipelineProps">SparkEmrCICDPipelineProps</a>

the SparkCICDPipelineProps properties.

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#@adsf/framework.SparkEmrCICDPipeline.toString">toString</a></code> | Returns a string representation of this construct. |

---

##### `toString` <a name="toString" id="@adsf/framework.SparkEmrCICDPipeline.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#@adsf/framework.SparkEmrCICDPipeline.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |

---

##### `isConstruct` <a name="isConstruct" id="@adsf/framework.SparkEmrCICDPipeline.isConstruct"></a>

```typescript
import { SparkEmrCICDPipeline } from '@adsf/framework'

SparkEmrCICDPipeline.isConstruct(x: any)
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

###### `x`<sup>Required</sup> <a name="x" id="@adsf/framework.SparkEmrCICDPipeline.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@adsf/framework.SparkEmrCICDPipeline.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#@adsf/framework.SparkEmrCICDPipeline.property.pipeline">pipeline</a></code> | <code>aws-cdk-lib.pipelines.CodePipeline</code> | The CodePipeline created as part of the Spark CICD Pipeline. |

---

##### `node`<sup>Required</sup> <a name="node" id="@adsf/framework.SparkEmrCICDPipeline.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `pipeline`<sup>Required</sup> <a name="pipeline" id="@adsf/framework.SparkEmrCICDPipeline.property.pipeline"></a>

```typescript
public readonly pipeline: CodePipeline;
```

- *Type:* aws-cdk-lib.pipelines.CodePipeline

The CodePipeline created as part of the Spark CICD Pipeline.

---

#### Constants <a name="Constants" id="Constants"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@adsf/framework.SparkEmrCICDPipeline.property.ADSF_TRACKING_CODE">ADSF_TRACKING_CODE</a></code> | <code>string</code> | *No description.* |

---

##### `ADSF_TRACKING_CODE`<sup>Required</sup> <a name="ADSF_TRACKING_CODE" id="@adsf/framework.SparkEmrCICDPipeline.property.ADSF_TRACKING_CODE"></a>

```typescript
public readonly ADSF_TRACKING_CODE: string;
```

- *Type:* string

---

### SparkEmrServerlessRuntime <a name="SparkEmrServerlessRuntime" id="@adsf/framework.SparkEmrServerlessRuntime"></a>

A construct to create a Spark EMR Serverless Application   The construct takes as props {@link SparkEmrServerlessRuntimeProps}   The construct offers method to create execution role for EMR Serverless   The construct offers a method to allow an IAM role to call the `StartJobRun` and monitor the status of the job.

*Example*

```typescript
const runtimeServerless = new SparkRuntimeServerless(stack, 'SparkRuntimeServerlessStack', {
   releaseLabel: 'emr-6.12.0',
   name: 'spark-serverless-demo'
});

const myFileSystemPolicy = new PolicyDocument({
   statements: [new PolicyStatement({
     actions: [
       's3:GetObject',
     ],
     resources: ['S3-BUCKET'],
   })],
 });

let myTestRole = new Role (stack, 'TestRole', {
   assumedBy: IAM-PRINCIPAL,
});

const myExecutionRole = SparkRuntimeServerless.createExecutionRole(stack, 'execRole1', myFileSystemPolicy);
const myExecutionRole1 = SparkRuntimeServerless.createExecutionRole(stack, 'execRole2', myFileSystemPolicy)

runtimeServerless.grantJobExecution(myTestRole, myExecutionRole.roleArn);

new cdk.CfnOutput(stack, 'SparkRuntimeServerlessStackApplicationArn', {
   value: runtimeServerless.applicationArn,
});
```


#### Initializers <a name="Initializers" id="@adsf/framework.SparkEmrServerlessRuntime.Initializer"></a>

```typescript
import { SparkEmrServerlessRuntime } from '@adsf/framework'

new SparkEmrServerlessRuntime(scope: Construct, id: string, props: SparkEmrServerlessRuntimeProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@adsf/framework.SparkEmrServerlessRuntime.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | the Scope of the CDK Construct. |
| <code><a href="#@adsf/framework.SparkEmrServerlessRuntime.Initializer.parameter.id">id</a></code> | <code>string</code> | the ID of the CDK Construct. |
| <code><a href="#@adsf/framework.SparkEmrServerlessRuntime.Initializer.parameter.props">props</a></code> | <code><a href="#@adsf/framework.SparkEmrServerlessRuntimeProps">SparkEmrServerlessRuntimeProps</a></code> | {@link SparkEmrServerlessRuntimeProps}. |

---

##### `scope`<sup>Required</sup> <a name="scope" id="@adsf/framework.SparkEmrServerlessRuntime.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

the Scope of the CDK Construct.

---

##### `id`<sup>Required</sup> <a name="id" id="@adsf/framework.SparkEmrServerlessRuntime.Initializer.parameter.id"></a>

- *Type:* string

the ID of the CDK Construct.

---

##### `props`<sup>Required</sup> <a name="props" id="@adsf/framework.SparkEmrServerlessRuntime.Initializer.parameter.props"></a>

- *Type:* <a href="#@adsf/framework.SparkEmrServerlessRuntimeProps">SparkEmrServerlessRuntimeProps</a>

{@link SparkEmrServerlessRuntimeProps}.

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#@adsf/framework.SparkEmrServerlessRuntime.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#@adsf/framework.SparkEmrServerlessRuntime.grantExecution">grantExecution</a></code> | A method which will grant an IAM Role the right to start and monitor a job. |

---

##### `toString` <a name="toString" id="@adsf/framework.SparkEmrServerlessRuntime.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `grantExecution` <a name="grantExecution" id="@adsf/framework.SparkEmrServerlessRuntime.grantExecution"></a>

```typescript
public grantExecution(startJobRole: IRole, executionRoleArn: string): void
```

A method which will grant an IAM Role the right to start and monitor a job.

The method will also attach an iam:PassRole permission to limited to the IAM Job Execution roles passed.
The excution role will be able to submit job to the EMR Serverless application created by the construct.

###### `startJobRole`<sup>Required</sup> <a name="startJobRole" id="@adsf/framework.SparkEmrServerlessRuntime.grantExecution.parameter.startJobRole"></a>

- *Type:* aws-cdk-lib.aws_iam.IRole

the role that will call the start job api and which need to have the iam:PassRole permission.

---

###### `executionRoleArn`<sup>Required</sup> <a name="executionRoleArn" id="@adsf/framework.SparkEmrServerlessRuntime.grantExecution.parameter.executionRoleArn"></a>

- *Type:* string

the role use by EMR Serverless to access resources during the job execution.

---

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#@adsf/framework.SparkEmrServerlessRuntime.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |
| <code><a href="#@adsf/framework.SparkEmrServerlessRuntime.createExecutionRole">createExecutionRole</a></code> | A static method which will create an execution IAM role that can be assumed by EMR Serverless and return it. |
| <code><a href="#@adsf/framework.SparkEmrServerlessRuntime.grantJobExecution">grantJobExecution</a></code> | A static method which will grant an IAM Role the right to start and monitor a job. |

---

##### `isConstruct` <a name="isConstruct" id="@adsf/framework.SparkEmrServerlessRuntime.isConstruct"></a>

```typescript
import { SparkEmrServerlessRuntime } from '@adsf/framework'

SparkEmrServerlessRuntime.isConstruct(x: any)
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

###### `x`<sup>Required</sup> <a name="x" id="@adsf/framework.SparkEmrServerlessRuntime.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

##### `createExecutionRole` <a name="createExecutionRole" id="@adsf/framework.SparkEmrServerlessRuntime.createExecutionRole"></a>

```typescript
import { SparkEmrServerlessRuntime } from '@adsf/framework'

SparkEmrServerlessRuntime.createExecutionRole(scope: Construct, id: string, executionRolePolicyDocument?: PolicyDocument, iamPolicyName?: string)
```

A static method which will create an execution IAM role that can be assumed by EMR Serverless and return it.

###### `scope`<sup>Required</sup> <a name="scope" id="@adsf/framework.SparkEmrServerlessRuntime.createExecutionRole.parameter.scope"></a>

- *Type:* constructs.Construct

the scope in which to create the role.

---

###### `id`<sup>Required</sup> <a name="id" id="@adsf/framework.SparkEmrServerlessRuntime.createExecutionRole.parameter.id"></a>

- *Type:* string

passed to the IAM Role construct object.

---

###### `executionRolePolicyDocument`<sup>Optional</sup> <a name="executionRolePolicyDocument" id="@adsf/framework.SparkEmrServerlessRuntime.createExecutionRole.parameter.executionRolePolicyDocument"></a>

- *Type:* aws-cdk-lib.aws_iam.PolicyDocument

the inline policy to attach to the role, this is the IAM policies needed by the job, for example they can be either access to S3 bucket or DynamDB table.

This parameter is mutually execlusive with iamPolicyName.

---

###### `iamPolicyName`<sup>Optional</sup> <a name="iamPolicyName" id="@adsf/framework.SparkEmrServerlessRuntime.createExecutionRole.parameter.iamPolicyName"></a>

- *Type:* string

the IAM policy name to attach to the role, this is mutually execlusive with executionRolePolicyDocument.

---

##### `grantJobExecution` <a name="grantJobExecution" id="@adsf/framework.SparkEmrServerlessRuntime.grantJobExecution"></a>

```typescript
import { SparkEmrServerlessRuntime } from '@adsf/framework'

SparkEmrServerlessRuntime.grantJobExecution(startJobRole: IRole, executionRoleArn: string[], applicationArns: string[])
```

A static method which will grant an IAM Role the right to start and monitor a job.

The method will also attach an iam:PassRole permission limited to the IAM Job Execution roles passed

###### `startJobRole`<sup>Required</sup> <a name="startJobRole" id="@adsf/framework.SparkEmrServerlessRuntime.grantJobExecution.parameter.startJobRole"></a>

- *Type:* aws-cdk-lib.aws_iam.IRole

the role that will call the start job api and which needs to have the iam:PassRole permission.

---

###### `executionRoleArn`<sup>Required</sup> <a name="executionRoleArn" id="@adsf/framework.SparkEmrServerlessRuntime.grantJobExecution.parameter.executionRoleArn"></a>

- *Type:* string[]

the role used by EMR Serverless to access resources during the job execution.

---

###### `applicationArns`<sup>Required</sup> <a name="applicationArns" id="@adsf/framework.SparkEmrServerlessRuntime.grantJobExecution.parameter.applicationArns"></a>

- *Type:* string[]

the EMR Serverless aplication ARN, this is used by the method to limit the EMR Serverless applications the role can submit job to.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@adsf/framework.SparkEmrServerlessRuntime.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#@adsf/framework.SparkEmrServerlessRuntime.property.applicationArn">applicationArn</a></code> | <code>string</code> | *No description.* |

---

##### `node`<sup>Required</sup> <a name="node" id="@adsf/framework.SparkEmrServerlessRuntime.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `applicationArn`<sup>Required</sup> <a name="applicationArn" id="@adsf/framework.SparkEmrServerlessRuntime.property.applicationArn"></a>

```typescript
public readonly applicationArn: string;
```

- *Type:* string

---

#### Constants <a name="Constants" id="Constants"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#framework.SparkRuntimeServerless.property.ADSF_OWNED_TAG">ADSF_OWNED_TAG</a></code> | <code>string</code> | *No description.* |
| <code><a href="#framework.SparkRuntimeServerless.property.ADSF_TRACKING_CODE">ADSF_TRACKING_CODE</a></code> | <code>string</code> | *No description.* |

---

##### `ADSF_OWNED_TAG`<sup>Required</sup> <a name="ADSF_OWNED_TAG" id="framework.SparkRuntimeServerless.property.ADSF_OWNED_TAG"></a>

```typescript
public readonly ADSF_OWNED_TAG: string;
```

- *Type:* string

---

##### `ADSF_TRACKING_CODE`<sup>Required</sup> <a name="ADSF_TRACKING_CODE" id="framework.SparkRuntimeServerless.property.ADSF_TRACKING_CODE"></a>

```typescript
public readonly ADSF_TRACKING_CODE: string;
```

- *Type:* string

---

## Structs <a name="Structs" id="Structs"></a>

### DataLakeStorageProps <a name="DataLakeStorageProps" id="aws-data-solutions-framework.DataLakeStorageProps"></a>

Properties for the DataLakeStorage Construct.

#### Initializer <a name="Initializer" id="aws-data-solutions-framework.DataLakeStorageProps.Initializer"></a>

```typescript
import { DataLakeStorageProps } from 'aws-data-solutions-framework'

const dataLakeStorageProps: DataLakeStorageProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#aws-data-solutions-framework.DataLakeStorageProps.property.bronzeArchiveDelay">bronzeArchiveDelay</a></code> | <code>number</code> | Delay (in days) before archiving BRONZE data to frozen storage (Glacier storage class). |
| <code><a href="#aws-data-solutions-framework.DataLakeStorageProps.property.bronzeInfrequentAccessDelay">bronzeInfrequentAccessDelay</a></code> | <code>number</code> | Delay (in days) before moving BRONZE data to cold storage (Infrequent Access storage class). |
| <code><a href="#aws-data-solutions-framework.DataLakeStorageProps.property.bronzeName">bronzeName</a></code> | <code>string</code> | Name of the Bronze bucket. |
| <code><a href="#aws-data-solutions-framework.DataLakeStorageProps.property.dataLakeKey">dataLakeKey</a></code> | <code>aws-cdk-lib.aws_kms.Key</code> | The KMS Key used to encrypt all the buckets of the DataLakeStorage. |
| <code><a href="#aws-data-solutions-framework.DataLakeStorageProps.property.goldArchiveDelay">goldArchiveDelay</a></code> | <code>number</code> | Delay (in days) before archiving GOLD data to frozen storage (Glacier storage class). |
| <code><a href="#aws-data-solutions-framework.DataLakeStorageProps.property.goldInfrequentAccessDelay">goldInfrequentAccessDelay</a></code> | <code>number</code> | Delay (in days) before moving GOLD data to cold storage (Infrequent Access storage class). |
| <code><a href="#aws-data-solutions-framework.DataLakeStorageProps.property.goldName">goldName</a></code> | <code>string</code> | Name of the Gold bucket. |
| <code><a href="#aws-data-solutions-framework.DataLakeStorageProps.property.removalPolicy">removalPolicy</a></code> | <code>aws-cdk-lib.RemovalPolicy</code> | The removal policy when deleting the CDK resource. |
| <code><a href="#aws-data-solutions-framework.DataLakeStorageProps.property.silverArchiveDelay">silverArchiveDelay</a></code> | <code>number</code> | Delay (in days) before archiving SILVER data to frozen storage (Glacier storage class). |
| <code><a href="#aws-data-solutions-framework.DataLakeStorageProps.property.silverInfrequentAccessDelay">silverInfrequentAccessDelay</a></code> | <code>number</code> | Delay (in days) before moving SILVER data to cold storage (Infrequent Access storage class). |
| <code><a href="#aws-data-solutions-framework.DataLakeStorageProps.property.silverName">silverName</a></code> | <code>string</code> | Name of the Silver bucket. |

---

##### `bronzeArchiveDelay`<sup>Optional</sup> <a name="bronzeArchiveDelay" id="aws-data-solutions-framework.DataLakeStorageProps.property.bronzeArchiveDelay"></a>

```typescript
public readonly bronzeArchiveDelay: number;
```

- *Type:* number
- *Default:* Move objects to Glacier after 90 days

Delay (in days) before archiving BRONZE data to frozen storage (Glacier storage class).

---

##### `bronzeInfrequentAccessDelay`<sup>Optional</sup> <a name="bronzeInfrequentAccessDelay" id="aws-data-solutions-framework.DataLakeStorageProps.property.bronzeInfrequentAccessDelay"></a>

```typescript
public readonly bronzeInfrequentAccessDelay: number;
```

- *Type:* number
- *Default:* Move objects to Infrequent Access after 30 days

Delay (in days) before moving BRONZE data to cold storage (Infrequent Access storage class).

---

##### `bronzeName`<sup>Optional</sup> <a name="bronzeName" id="aws-data-solutions-framework.DataLakeStorageProps.property.bronzeName"></a>

```typescript
public readonly bronzeName: string;
```

- *Type:* string
- *Default:* `bronze` will be used

Name of the Bronze bucket.

Will be appended by a unique ID.

---

##### `dataLakeKey`<sup>Optional</sup> <a name="dataLakeKey" id="aws-data-solutions-framework.DataLakeStorageProps.property.dataLakeKey"></a>

```typescript
public readonly dataLakeKey: Key;
```

- *Type:* aws-cdk-lib.aws_kms.Key
- *Default:* A single KMS customer key is created

The KMS Key used to encrypt all the buckets of the DataLakeStorage.

---

##### `goldArchiveDelay`<sup>Optional</sup> <a name="goldArchiveDelay" id="aws-data-solutions-framework.DataLakeStorageProps.property.goldArchiveDelay"></a>

```typescript
public readonly goldArchiveDelay: number;
```

- *Type:* number
- *Default:* Objects are not archived to Glacier

Delay (in days) before archiving GOLD data to frozen storage (Glacier storage class).

---

##### `goldInfrequentAccessDelay`<sup>Optional</sup> <a name="goldInfrequentAccessDelay" id="aws-data-solutions-framework.DataLakeStorageProps.property.goldInfrequentAccessDelay"></a>

```typescript
public readonly goldInfrequentAccessDelay: number;
```

- *Type:* number
- *Default:* Move objects to Infrequent Access after 90 days

Delay (in days) before moving GOLD data to cold storage (Infrequent Access storage class).

---

##### `goldName`<sup>Optional</sup> <a name="goldName" id="aws-data-solutions-framework.DataLakeStorageProps.property.goldName"></a>

```typescript
public readonly goldName: string;
```

- *Type:* string
- *Default:* `gold` will be used

Name of the Gold bucket.

Will be appended by a unique ID.

---

##### `removalPolicy`<sup>Optional</sup> <a name="removalPolicy" id="aws-data-solutions-framework.DataLakeStorageProps.property.removalPolicy"></a>

```typescript
public readonly removalPolicy: RemovalPolicy;
```

- *Type:* aws-cdk-lib.RemovalPolicy
- *Default:* The resources are not deleted (`RemovalPolicy.RETAIN`)

The removal policy when deleting the CDK resource.

If DESTROY is selected, context value `@aws-data-solutions-framework/removeDataOnDestroy` needs to be set to true.
Otherwise the removalPolicy is reverted to RETAIN.

---

##### `silverArchiveDelay`<sup>Optional</sup> <a name="silverArchiveDelay" id="aws-data-solutions-framework.DataLakeStorageProps.property.silverArchiveDelay"></a>

```typescript
public readonly silverArchiveDelay: number;
```

- *Type:* number
- *Default:* Objects are not archived to Glacier

Delay (in days) before archiving SILVER data to frozen storage (Glacier storage class).

---

##### `silverInfrequentAccessDelay`<sup>Optional</sup> <a name="silverInfrequentAccessDelay" id="aws-data-solutions-framework.DataLakeStorageProps.property.silverInfrequentAccessDelay"></a>

```typescript
public readonly silverInfrequentAccessDelay: number;
```

- *Type:* number
- *Default:* Move objects to Infrequent Access after 90 days

Delay (in days) before moving SILVER data to cold storage (Infrequent Access storage class).

---

##### `silverName`<sup>Optional</sup> <a name="silverName" id="aws-data-solutions-framework.DataLakeStorageProps.property.silverName"></a>

```typescript
public readonly silverName: string;
```

- *Type:* string
- *Default:* `silver` will be used

Name of the Silver bucket.

Will be appended by a unique ID.

---

## Classes <a name="Classes" id="Classes"></a>

### ApplicationStackFactory <a name="ApplicationStackFactory" id="@adsf/framework.ApplicationStackFactory"></a>

Abstract class that needs to be implemented to pass the application Stack to the CICD pipeline.

*Example*

```typescript
import { ApplicationStackFactory }
import { CICDStage } from './application-stage';

interface MyApplicationStackProps extends StackProps {
  readonly stage: CICDStage;
}

class MyApplicationStack extends Stack {
  constructor(scope: Stack, id: string, props?: MyApplicationStackProps) {
    super(scope, id, props);
    // stack logic goes here... and can be customized using props.stage
  }
}

class MyApplicationStackFactory extends ApplicationStackFactory {
  createStack(scope: Construct, stage: CICDStage): Stack {
    return new MyApplicationStack(scope, 'MyApplication', {
      stage: stage
    } as MyApplicationStackProps);
  }
}
```


#### Initializers <a name="Initializers" id="@adsf/framework.ApplicationStackFactory.Initializer"></a>

```typescript
import { ApplicationStackFactory } from '@adsf/framework'

new ApplicationStackFactory()
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#@adsf/framework.ApplicationStackFactory.createStack">createStack</a></code> | Abstract method that needs to be implemented to return the application Stack. |

---

##### `createStack` <a name="createStack" id="@adsf/framework.ApplicationStackFactory.createStack"></a>

```typescript
public createStack(scope: Construct, stage: CICDStage): Stack
```

Abstract method that needs to be implemented to return the application Stack.

###### `scope`<sup>Required</sup> <a name="scope" id="@adsf/framework.ApplicationStackFactory.createStack.parameter.scope"></a>

- *Type:* constructs.Construct

The scope to create the stack in.

---

###### `stage`<sup>Required</sup> <a name="stage" id="@adsf/framework.ApplicationStackFactory.createStack.parameter.stage"></a>

- *Type:* <a href="#@adsf/framework.CICDStage">CICDStage</a>

The stage of the pipeline.

---





