# AWS Data Solutions Framework
# API Reference <a name="API Reference" id="api-reference"></a>

## Constructs <a name="Constructs" id="Constructs"></a>

### AccessLogsBucket <a name="AccessLogsBucket" id="framework.AccessLogsBucket"></a>

Amazon S3 Bucket configured with best-practices and smart defaults for storing S3 access logs.

*Example*

```typescript
import * as cdk from 'aws-cdk-lib';
import { AccessLogsBucket } from 'aws-data-solutions-framework';

const bucket = new AccessLogsBucket(this, 'AccessLogsBucket', {
 removalPolicy: RemovalPolicy.DESTROY,
})
```

#### Initializers <a name="Initializers" id="framework.AccessLogsBucket.Initializer"></a>

```typescript
import { AccessLogsBucket } from 'framework'

new AccessLogsBucket(scope: Construct, id: string, props?: BucketProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#framework.AccessLogsBucket.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | *No description.* |
| <code><a href="#framework.AccessLogsBucket.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#framework.AccessLogsBucket.Initializer.parameter.props">props</a></code> | <code>aws-cdk-lib.aws_s3.BucketProps</code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="framework.AccessLogsBucket.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="framework.AccessLogsBucket.Initializer.parameter.id"></a>

- *Type:* string

---

##### `props`<sup>Optional</sup> <a name="props" id="framework.AccessLogsBucket.Initializer.parameter.props"></a>

- *Type:* aws-cdk-lib.aws_s3.BucketProps

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#framework.AccessLogsBucket.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#framework.AccessLogsBucket.applyRemovalPolicy">applyRemovalPolicy</a></code> | Apply the given removal policy to this resource. |
| <code><a href="#framework.AccessLogsBucket.addEventNotification">addEventNotification</a></code> | Adds a bucket notification event destination. |
| <code><a href="#framework.AccessLogsBucket.addObjectCreatedNotification">addObjectCreatedNotification</a></code> | Subscribes a destination to receive notifications when an object is created in the bucket. |
| <code><a href="#framework.AccessLogsBucket.addObjectRemovedNotification">addObjectRemovedNotification</a></code> | Subscribes a destination to receive notifications when an object is removed from the bucket. |
| <code><a href="#framework.AccessLogsBucket.addToResourcePolicy">addToResourcePolicy</a></code> | Adds a statement to the resource policy for a principal (i.e. account/role/service) to perform actions on this bucket and/or its contents. Use `bucketArn` and `arnForObjects(keys)` to obtain ARNs for this bucket or objects. |
| <code><a href="#framework.AccessLogsBucket.arnForObjects">arnForObjects</a></code> | Returns an ARN that represents all objects within the bucket that match the key pattern specified. |
| <code><a href="#framework.AccessLogsBucket.enableEventBridgeNotification">enableEventBridgeNotification</a></code> | Enables event bridge notification, causing all events below to be sent to EventBridge:. |
| <code><a href="#framework.AccessLogsBucket.grantDelete">grantDelete</a></code> | Grants s3:DeleteObject* permission to an IAM principal for objects in this bucket. |
| <code><a href="#framework.AccessLogsBucket.grantPublicAccess">grantPublicAccess</a></code> | Allows unrestricted access to objects from this bucket. |
| <code><a href="#framework.AccessLogsBucket.grantPut">grantPut</a></code> | Grants s3:PutObject* and s3:Abort* permissions for this bucket to an IAM principal. |
| <code><a href="#framework.AccessLogsBucket.grantPutAcl">grantPutAcl</a></code> | Grant the given IAM identity permissions to modify the ACLs of objects in the given Bucket. |
| <code><a href="#framework.AccessLogsBucket.grantRead">grantRead</a></code> | Grant read permissions for this bucket and it's contents to an IAM principal (Role/Group/User). |
| <code><a href="#framework.AccessLogsBucket.grantReadWrite">grantReadWrite</a></code> | Grants read/write permissions for this bucket and it's contents to an IAM principal (Role/Group/User). |
| <code><a href="#framework.AccessLogsBucket.grantWrite">grantWrite</a></code> | Grant write permissions to this bucket to an IAM principal. |
| <code><a href="#framework.AccessLogsBucket.onCloudTrailEvent">onCloudTrailEvent</a></code> | Define a CloudWatch event that triggers when something happens to this repository. |
| <code><a href="#framework.AccessLogsBucket.onCloudTrailPutObject">onCloudTrailPutObject</a></code> | Defines an AWS CloudWatch event that triggers when an object is uploaded to the specified paths (keys) in this bucket using the PutObject API call. |
| <code><a href="#framework.AccessLogsBucket.onCloudTrailWriteObject">onCloudTrailWriteObject</a></code> | Defines an AWS CloudWatch event that triggers when an object at the specified paths (keys) in this bucket are written to. |
| <code><a href="#framework.AccessLogsBucket.s3UrlForObject">s3UrlForObject</a></code> | The S3 URL of an S3 object. For example:. |
| <code><a href="#framework.AccessLogsBucket.transferAccelerationUrlForObject">transferAccelerationUrlForObject</a></code> | The https Transfer Acceleration URL of an S3 object. |
| <code><a href="#framework.AccessLogsBucket.urlForObject">urlForObject</a></code> | The https URL of an S3 object. Specify `regional: false` at the options for non-regional URLs. For example:. |
| <code><a href="#framework.AccessLogsBucket.virtualHostedUrlForObject">virtualHostedUrlForObject</a></code> | The virtual hosted-style URL of an S3 object. Specify `regional: false` at the options for non-regional URL. For example:. |
| <code><a href="#framework.AccessLogsBucket.addCorsRule">addCorsRule</a></code> | Adds a cross-origin access configuration for objects in an Amazon S3 bucket. |
| <code><a href="#framework.AccessLogsBucket.addInventory">addInventory</a></code> | Add an inventory configuration. |
| <code><a href="#framework.AccessLogsBucket.addLifecycleRule">addLifecycleRule</a></code> | Add a lifecycle rule to the bucket. |
| <code><a href="#framework.AccessLogsBucket.addMetric">addMetric</a></code> | Adds a metrics configuration for the CloudWatch request metrics from the bucket. |

---

##### `toString` <a name="toString" id="framework.AccessLogsBucket.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `applyRemovalPolicy` <a name="applyRemovalPolicy" id="framework.AccessLogsBucket.applyRemovalPolicy"></a>

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

###### `policy`<sup>Required</sup> <a name="policy" id="framework.AccessLogsBucket.applyRemovalPolicy.parameter.policy"></a>

- *Type:* aws-cdk-lib.RemovalPolicy

---

##### `addEventNotification` <a name="addEventNotification" id="framework.AccessLogsBucket.addEventNotification"></a>

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


###### `event`<sup>Required</sup> <a name="event" id="framework.AccessLogsBucket.addEventNotification.parameter.event"></a>

- *Type:* aws-cdk-lib.aws_s3.EventType

The event to trigger the notification.

---

###### `dest`<sup>Required</sup> <a name="dest" id="framework.AccessLogsBucket.addEventNotification.parameter.dest"></a>

- *Type:* aws-cdk-lib.aws_s3.IBucketNotificationDestination

The notification destination (Lambda, SNS Topic or SQS Queue).

---

###### `filters`<sup>Required</sup> <a name="filters" id="framework.AccessLogsBucket.addEventNotification.parameter.filters"></a>

- *Type:* aws-cdk-lib.aws_s3.NotificationKeyFilter

S3 object key filter rules to determine which objects trigger this event.

Each filter must include a `prefix` and/or `suffix`
that will be matched against the s3 object key. Refer to the S3 Developer Guide
for details about allowed filter rules.

---

##### `addObjectCreatedNotification` <a name="addObjectCreatedNotification" id="framework.AccessLogsBucket.addObjectCreatedNotification"></a>

```typescript
public addObjectCreatedNotification(dest: IBucketNotificationDestination, filters: NotificationKeyFilter): void
```

Subscribes a destination to receive notifications when an object is created in the bucket.

This is identical to calling
`onEvent(EventType.OBJECT_CREATED)`.

###### `dest`<sup>Required</sup> <a name="dest" id="framework.AccessLogsBucket.addObjectCreatedNotification.parameter.dest"></a>

- *Type:* aws-cdk-lib.aws_s3.IBucketNotificationDestination

The notification destination (see onEvent).

---

###### `filters`<sup>Required</sup> <a name="filters" id="framework.AccessLogsBucket.addObjectCreatedNotification.parameter.filters"></a>

- *Type:* aws-cdk-lib.aws_s3.NotificationKeyFilter

Filters (see onEvent).

---

##### `addObjectRemovedNotification` <a name="addObjectRemovedNotification" id="framework.AccessLogsBucket.addObjectRemovedNotification"></a>

```typescript
public addObjectRemovedNotification(dest: IBucketNotificationDestination, filters: NotificationKeyFilter): void
```

Subscribes a destination to receive notifications when an object is removed from the bucket.

This is identical to calling
`onEvent(EventType.OBJECT_REMOVED)`.

###### `dest`<sup>Required</sup> <a name="dest" id="framework.AccessLogsBucket.addObjectRemovedNotification.parameter.dest"></a>

- *Type:* aws-cdk-lib.aws_s3.IBucketNotificationDestination

The notification destination (see onEvent).

---

###### `filters`<sup>Required</sup> <a name="filters" id="framework.AccessLogsBucket.addObjectRemovedNotification.parameter.filters"></a>

- *Type:* aws-cdk-lib.aws_s3.NotificationKeyFilter

Filters (see onEvent).

---

##### `addToResourcePolicy` <a name="addToResourcePolicy" id="framework.AccessLogsBucket.addToResourcePolicy"></a>

```typescript
public addToResourcePolicy(permission: PolicyStatement): AddToResourcePolicyResult
```

Adds a statement to the resource policy for a principal (i.e. account/role/service) to perform actions on this bucket and/or its contents. Use `bucketArn` and `arnForObjects(keys)` to obtain ARNs for this bucket or objects.

Note that the policy statement may or may not be added to the policy.
For example, when an `IBucket` is created from an existing bucket,
it's not possible to tell whether the bucket already has a policy
attached, let alone to re-use that policy to add more statements to it.
So it's safest to do nothing in these cases.

###### `permission`<sup>Required</sup> <a name="permission" id="framework.AccessLogsBucket.addToResourcePolicy.parameter.permission"></a>

- *Type:* aws-cdk-lib.aws_iam.PolicyStatement

the policy statement to be added to the bucket's policy.

---

##### `arnForObjects` <a name="arnForObjects" id="framework.AccessLogsBucket.arnForObjects"></a>

```typescript
public arnForObjects(keyPattern: string): string
```

Returns an ARN that represents all objects within the bucket that match the key pattern specified.

To represent all keys, specify ``"*"``.

If you need to specify a keyPattern with multiple components, concatenate them into a single string, e.g.:

  arnForObjects(`home/${team}/${user}/*`)

###### `keyPattern`<sup>Required</sup> <a name="keyPattern" id="framework.AccessLogsBucket.arnForObjects.parameter.keyPattern"></a>

- *Type:* string

---

##### `enableEventBridgeNotification` <a name="enableEventBridgeNotification" id="framework.AccessLogsBucket.enableEventBridgeNotification"></a>

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

##### `grantDelete` <a name="grantDelete" id="framework.AccessLogsBucket.grantDelete"></a>

```typescript
public grantDelete(identity: IGrantable, objectsKeyPattern?: any): Grant
```

Grants s3:DeleteObject* permission to an IAM principal for objects in this bucket.

###### `identity`<sup>Required</sup> <a name="identity" id="framework.AccessLogsBucket.grantDelete.parameter.identity"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

The principal.

---

###### `objectsKeyPattern`<sup>Optional</sup> <a name="objectsKeyPattern" id="framework.AccessLogsBucket.grantDelete.parameter.objectsKeyPattern"></a>

- *Type:* any

Restrict the permission to a certain key pattern (default '*').

---

##### `grantPublicAccess` <a name="grantPublicAccess" id="framework.AccessLogsBucket.grantPublicAccess"></a>

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

###### `allowedActions`<sup>Required</sup> <a name="allowedActions" id="framework.AccessLogsBucket.grantPublicAccess.parameter.allowedActions"></a>

- *Type:* string

the set of S3 actions to allow.

Default is "s3:GetObject".

---

###### `keyPrefix`<sup>Optional</sup> <a name="keyPrefix" id="framework.AccessLogsBucket.grantPublicAccess.parameter.keyPrefix"></a>

- *Type:* string

the prefix of S3 object keys (e.g. `home/*`). Default is "*".

---

##### `grantPut` <a name="grantPut" id="framework.AccessLogsBucket.grantPut"></a>

```typescript
public grantPut(identity: IGrantable, objectsKeyPattern?: any): Grant
```

Grants s3:PutObject* and s3:Abort* permissions for this bucket to an IAM principal.

If encryption is used, permission to use the key to encrypt the contents
of written files will also be granted to the same principal.

###### `identity`<sup>Required</sup> <a name="identity" id="framework.AccessLogsBucket.grantPut.parameter.identity"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

The principal.

---

###### `objectsKeyPattern`<sup>Optional</sup> <a name="objectsKeyPattern" id="framework.AccessLogsBucket.grantPut.parameter.objectsKeyPattern"></a>

- *Type:* any

Restrict the permission to a certain key pattern (default '*').

---

##### `grantPutAcl` <a name="grantPutAcl" id="framework.AccessLogsBucket.grantPutAcl"></a>

```typescript
public grantPutAcl(identity: IGrantable, objectsKeyPattern?: string): Grant
```

Grant the given IAM identity permissions to modify the ACLs of objects in the given Bucket.

If your application has the '@aws-cdk/aws-s3:grantWriteWithoutAcl' feature flag set,
calling `grantWrite` or `grantReadWrite` no longer grants permissions to modify the ACLs of the objects;
in this case, if you need to modify object ACLs, call this method explicitly.

###### `identity`<sup>Required</sup> <a name="identity" id="framework.AccessLogsBucket.grantPutAcl.parameter.identity"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

---

###### `objectsKeyPattern`<sup>Optional</sup> <a name="objectsKeyPattern" id="framework.AccessLogsBucket.grantPutAcl.parameter.objectsKeyPattern"></a>

- *Type:* string

---

##### `grantRead` <a name="grantRead" id="framework.AccessLogsBucket.grantRead"></a>

```typescript
public grantRead(identity: IGrantable, objectsKeyPattern?: any): Grant
```

Grant read permissions for this bucket and it's contents to an IAM principal (Role/Group/User).

If encryption is used, permission to use the key to decrypt the contents
of the bucket will also be granted to the same principal.

###### `identity`<sup>Required</sup> <a name="identity" id="framework.AccessLogsBucket.grantRead.parameter.identity"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

The principal.

---

###### `objectsKeyPattern`<sup>Optional</sup> <a name="objectsKeyPattern" id="framework.AccessLogsBucket.grantRead.parameter.objectsKeyPattern"></a>

- *Type:* any

Restrict the permission to a certain key pattern (default '*').

---

##### `grantReadWrite` <a name="grantReadWrite" id="framework.AccessLogsBucket.grantReadWrite"></a>

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

###### `identity`<sup>Required</sup> <a name="identity" id="framework.AccessLogsBucket.grantReadWrite.parameter.identity"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

---

###### `objectsKeyPattern`<sup>Optional</sup> <a name="objectsKeyPattern" id="framework.AccessLogsBucket.grantReadWrite.parameter.objectsKeyPattern"></a>

- *Type:* any

---

##### `grantWrite` <a name="grantWrite" id="framework.AccessLogsBucket.grantWrite"></a>

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

###### `identity`<sup>Required</sup> <a name="identity" id="framework.AccessLogsBucket.grantWrite.parameter.identity"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

---

###### `objectsKeyPattern`<sup>Optional</sup> <a name="objectsKeyPattern" id="framework.AccessLogsBucket.grantWrite.parameter.objectsKeyPattern"></a>

- *Type:* any

---

###### `allowedActionPatterns`<sup>Optional</sup> <a name="allowedActionPatterns" id="framework.AccessLogsBucket.grantWrite.parameter.allowedActionPatterns"></a>

- *Type:* string[]

---

##### `onCloudTrailEvent` <a name="onCloudTrailEvent" id="framework.AccessLogsBucket.onCloudTrailEvent"></a>

```typescript
public onCloudTrailEvent(id: string, options?: OnCloudTrailBucketEventOptions): Rule
```

Define a CloudWatch event that triggers when something happens to this repository.

Requires that there exists at least one CloudTrail Trail in your account
that captures the event. This method will not create the Trail.

###### `id`<sup>Required</sup> <a name="id" id="framework.AccessLogsBucket.onCloudTrailEvent.parameter.id"></a>

- *Type:* string

The id of the rule.

---

###### `options`<sup>Optional</sup> <a name="options" id="framework.AccessLogsBucket.onCloudTrailEvent.parameter.options"></a>

- *Type:* aws-cdk-lib.aws_s3.OnCloudTrailBucketEventOptions

Options for adding the rule.

---

##### `onCloudTrailPutObject` <a name="onCloudTrailPutObject" id="framework.AccessLogsBucket.onCloudTrailPutObject"></a>

```typescript
public onCloudTrailPutObject(id: string, options?: OnCloudTrailBucketEventOptions): Rule
```

Defines an AWS CloudWatch event that triggers when an object is uploaded to the specified paths (keys) in this bucket using the PutObject API call.

Note that some tools like `aws s3 cp` will automatically use either
PutObject or the multipart upload API depending on the file size,
so using `onCloudTrailWriteObject` may be preferable.

Requires that there exists at least one CloudTrail Trail in your account
that captures the event. This method will not create the Trail.

###### `id`<sup>Required</sup> <a name="id" id="framework.AccessLogsBucket.onCloudTrailPutObject.parameter.id"></a>

- *Type:* string

The id of the rule.

---

###### `options`<sup>Optional</sup> <a name="options" id="framework.AccessLogsBucket.onCloudTrailPutObject.parameter.options"></a>

- *Type:* aws-cdk-lib.aws_s3.OnCloudTrailBucketEventOptions

Options for adding the rule.

---

##### `onCloudTrailWriteObject` <a name="onCloudTrailWriteObject" id="framework.AccessLogsBucket.onCloudTrailWriteObject"></a>

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

###### `id`<sup>Required</sup> <a name="id" id="framework.AccessLogsBucket.onCloudTrailWriteObject.parameter.id"></a>

- *Type:* string

The id of the rule.

---

###### `options`<sup>Optional</sup> <a name="options" id="framework.AccessLogsBucket.onCloudTrailWriteObject.parameter.options"></a>

- *Type:* aws-cdk-lib.aws_s3.OnCloudTrailBucketEventOptions

Options for adding the rule.

---

##### `s3UrlForObject` <a name="s3UrlForObject" id="framework.AccessLogsBucket.s3UrlForObject"></a>

```typescript
public s3UrlForObject(key?: string): string
```

The S3 URL of an S3 object. For example:.

`s3://onlybucket`
- `s3://bucket/key`

###### `key`<sup>Optional</sup> <a name="key" id="framework.AccessLogsBucket.s3UrlForObject.parameter.key"></a>

- *Type:* string

The S3 key of the object.

If not specified, the S3 URL of the
bucket is returned.

---

##### `transferAccelerationUrlForObject` <a name="transferAccelerationUrlForObject" id="framework.AccessLogsBucket.transferAccelerationUrlForObject"></a>

```typescript
public transferAccelerationUrlForObject(key?: string, options?: TransferAccelerationUrlOptions): string
```

The https Transfer Acceleration URL of an S3 object.

Specify `dualStack: true` at the options
for dual-stack endpoint (connect to the bucket over IPv6). For example:

- `https://bucket.s3-accelerate.amazonaws.com`
- `https://bucket.s3-accelerate.amazonaws.com/key`

###### `key`<sup>Optional</sup> <a name="key" id="framework.AccessLogsBucket.transferAccelerationUrlForObject.parameter.key"></a>

- *Type:* string

The S3 key of the object.

If not specified, the URL of the
bucket is returned.

---

###### `options`<sup>Optional</sup> <a name="options" id="framework.AccessLogsBucket.transferAccelerationUrlForObject.parameter.options"></a>

- *Type:* aws-cdk-lib.aws_s3.TransferAccelerationUrlOptions

Options for generating URL.

---

##### `urlForObject` <a name="urlForObject" id="framework.AccessLogsBucket.urlForObject"></a>

```typescript
public urlForObject(key?: string): string
```

The https URL of an S3 object. Specify `regional: false` at the options for non-regional URLs. For example:.

`https://s3.us-west-1.amazonaws.com/onlybucket`
- `https://s3.us-west-1.amazonaws.com/bucket/key`
- `https://s3.cn-north-1.amazonaws.com.cn/china-bucket/mykey`

###### `key`<sup>Optional</sup> <a name="key" id="framework.AccessLogsBucket.urlForObject.parameter.key"></a>

- *Type:* string

The S3 key of the object.

If not specified, the URL of the
bucket is returned.

---

##### `virtualHostedUrlForObject` <a name="virtualHostedUrlForObject" id="framework.AccessLogsBucket.virtualHostedUrlForObject"></a>

```typescript
public virtualHostedUrlForObject(key?: string, options?: VirtualHostedStyleUrlOptions): string
```

The virtual hosted-style URL of an S3 object. Specify `regional: false` at the options for non-regional URL. For example:.

`https://only-bucket.s3.us-west-1.amazonaws.com`
- `https://bucket.s3.us-west-1.amazonaws.com/key`
- `https://bucket.s3.amazonaws.com/key`
- `https://china-bucket.s3.cn-north-1.amazonaws.com.cn/mykey`

###### `key`<sup>Optional</sup> <a name="key" id="framework.AccessLogsBucket.virtualHostedUrlForObject.parameter.key"></a>

- *Type:* string

The S3 key of the object.

If not specified, the URL of the
bucket is returned.

---

###### `options`<sup>Optional</sup> <a name="options" id="framework.AccessLogsBucket.virtualHostedUrlForObject.parameter.options"></a>

- *Type:* aws-cdk-lib.aws_s3.VirtualHostedStyleUrlOptions

Options for generating URL.

---

##### `addCorsRule` <a name="addCorsRule" id="framework.AccessLogsBucket.addCorsRule"></a>

```typescript
public addCorsRule(rule: CorsRule): void
```

Adds a cross-origin access configuration for objects in an Amazon S3 bucket.

###### `rule`<sup>Required</sup> <a name="rule" id="framework.AccessLogsBucket.addCorsRule.parameter.rule"></a>

- *Type:* aws-cdk-lib.aws_s3.CorsRule

The CORS configuration rule to add.

---

##### `addInventory` <a name="addInventory" id="framework.AccessLogsBucket.addInventory"></a>

```typescript
public addInventory(inventory: Inventory): void
```

Add an inventory configuration.

###### `inventory`<sup>Required</sup> <a name="inventory" id="framework.AccessLogsBucket.addInventory.parameter.inventory"></a>

- *Type:* aws-cdk-lib.aws_s3.Inventory

configuration to add.

---

##### `addLifecycleRule` <a name="addLifecycleRule" id="framework.AccessLogsBucket.addLifecycleRule"></a>

```typescript
public addLifecycleRule(rule: LifecycleRule): void
```

Add a lifecycle rule to the bucket.

###### `rule`<sup>Required</sup> <a name="rule" id="framework.AccessLogsBucket.addLifecycleRule.parameter.rule"></a>

- *Type:* aws-cdk-lib.aws_s3.LifecycleRule

The rule to add.

---

##### `addMetric` <a name="addMetric" id="framework.AccessLogsBucket.addMetric"></a>

```typescript
public addMetric(metric: BucketMetrics): void
```

Adds a metrics configuration for the CloudWatch request metrics from the bucket.

###### `metric`<sup>Required</sup> <a name="metric" id="framework.AccessLogsBucket.addMetric.parameter.metric"></a>

- *Type:* aws-cdk-lib.aws_s3.BucketMetrics

The metric configuration to add.

---

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#framework.AccessLogsBucket.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |
| <code><a href="#framework.AccessLogsBucket.isOwnedResource">isOwnedResource</a></code> | Returns true if the construct was created by CDK, and false otherwise. |
| <code><a href="#framework.AccessLogsBucket.isResource">isResource</a></code> | Check whether the given construct is a Resource. |
| <code><a href="#framework.AccessLogsBucket.fromBucketArn">fromBucketArn</a></code> | *No description.* |
| <code><a href="#framework.AccessLogsBucket.fromBucketAttributes">fromBucketAttributes</a></code> | Creates a Bucket construct that represents an external bucket. |
| <code><a href="#framework.AccessLogsBucket.fromBucketName">fromBucketName</a></code> | *No description.* |
| <code><a href="#framework.AccessLogsBucket.fromCfnBucket">fromCfnBucket</a></code> | Create a mutable `IBucket` based on a low-level `CfnBucket`. |
| <code><a href="#framework.AccessLogsBucket.validateBucketName">validateBucketName</a></code> | Thrown an exception if the given bucket name is not valid. |

---

##### `isConstruct` <a name="isConstruct" id="framework.AccessLogsBucket.isConstruct"></a>

```typescript
import { AccessLogsBucket } from 'framework'

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

###### `x`<sup>Required</sup> <a name="x" id="framework.AccessLogsBucket.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

##### `isOwnedResource` <a name="isOwnedResource" id="framework.AccessLogsBucket.isOwnedResource"></a>

```typescript
import { AccessLogsBucket } from 'framework'

AccessLogsBucket.isOwnedResource(construct: IConstruct)
```

Returns true if the construct was created by CDK, and false otherwise.

###### `construct`<sup>Required</sup> <a name="construct" id="framework.AccessLogsBucket.isOwnedResource.parameter.construct"></a>

- *Type:* constructs.IConstruct

---

##### `isResource` <a name="isResource" id="framework.AccessLogsBucket.isResource"></a>

```typescript
import { AccessLogsBucket } from 'framework'

AccessLogsBucket.isResource(construct: IConstruct)
```

Check whether the given construct is a Resource.

###### `construct`<sup>Required</sup> <a name="construct" id="framework.AccessLogsBucket.isResource.parameter.construct"></a>

- *Type:* constructs.IConstruct

---

##### `fromBucketArn` <a name="fromBucketArn" id="framework.AccessLogsBucket.fromBucketArn"></a>

```typescript
import { AccessLogsBucket } from 'framework'

AccessLogsBucket.fromBucketArn(scope: Construct, id: string, bucketArn: string)
```

###### `scope`<sup>Required</sup> <a name="scope" id="framework.AccessLogsBucket.fromBucketArn.parameter.scope"></a>

- *Type:* constructs.Construct

---

###### `id`<sup>Required</sup> <a name="id" id="framework.AccessLogsBucket.fromBucketArn.parameter.id"></a>

- *Type:* string

---

###### `bucketArn`<sup>Required</sup> <a name="bucketArn" id="framework.AccessLogsBucket.fromBucketArn.parameter.bucketArn"></a>

- *Type:* string

---

##### `fromBucketAttributes` <a name="fromBucketAttributes" id="framework.AccessLogsBucket.fromBucketAttributes"></a>

```typescript
import { AccessLogsBucket } from 'framework'

AccessLogsBucket.fromBucketAttributes(scope: Construct, id: string, attrs: BucketAttributes)
```

Creates a Bucket construct that represents an external bucket.

###### `scope`<sup>Required</sup> <a name="scope" id="framework.AccessLogsBucket.fromBucketAttributes.parameter.scope"></a>

- *Type:* constructs.Construct

The parent creating construct (usually `this`).

---

###### `id`<sup>Required</sup> <a name="id" id="framework.AccessLogsBucket.fromBucketAttributes.parameter.id"></a>

- *Type:* string

The construct's name.

---

###### `attrs`<sup>Required</sup> <a name="attrs" id="framework.AccessLogsBucket.fromBucketAttributes.parameter.attrs"></a>

- *Type:* aws-cdk-lib.aws_s3.BucketAttributes

A `BucketAttributes` object.

Can be obtained from a call to
`bucket.export()` or manually created.

---

##### `fromBucketName` <a name="fromBucketName" id="framework.AccessLogsBucket.fromBucketName"></a>

```typescript
import { AccessLogsBucket } from 'framework'

AccessLogsBucket.fromBucketName(scope: Construct, id: string, bucketName: string)
```

###### `scope`<sup>Required</sup> <a name="scope" id="framework.AccessLogsBucket.fromBucketName.parameter.scope"></a>

- *Type:* constructs.Construct

---

###### `id`<sup>Required</sup> <a name="id" id="framework.AccessLogsBucket.fromBucketName.parameter.id"></a>

- *Type:* string

---

###### `bucketName`<sup>Required</sup> <a name="bucketName" id="framework.AccessLogsBucket.fromBucketName.parameter.bucketName"></a>

- *Type:* string

---

##### `fromCfnBucket` <a name="fromCfnBucket" id="framework.AccessLogsBucket.fromCfnBucket"></a>

```typescript
import { AccessLogsBucket } from 'framework'

AccessLogsBucket.fromCfnBucket(cfnBucket: CfnBucket)
```

Create a mutable `IBucket` based on a low-level `CfnBucket`.

###### `cfnBucket`<sup>Required</sup> <a name="cfnBucket" id="framework.AccessLogsBucket.fromCfnBucket.parameter.cfnBucket"></a>

- *Type:* aws-cdk-lib.aws_s3.CfnBucket

---

##### `validateBucketName` <a name="validateBucketName" id="framework.AccessLogsBucket.validateBucketName"></a>

```typescript
import { AccessLogsBucket } from 'framework'

AccessLogsBucket.validateBucketName(physicalName: string)
```

Thrown an exception if the given bucket name is not valid.

###### `physicalName`<sup>Required</sup> <a name="physicalName" id="framework.AccessLogsBucket.validateBucketName.parameter.physicalName"></a>

- *Type:* string

name of the bucket.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#framework.AccessLogsBucket.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#framework.AccessLogsBucket.property.env">env</a></code> | <code>aws-cdk-lib.ResourceEnvironment</code> | The environment this resource belongs to. |
| <code><a href="#framework.AccessLogsBucket.property.stack">stack</a></code> | <code>aws-cdk-lib.Stack</code> | The stack in which this resource is defined. |
| <code><a href="#framework.AccessLogsBucket.property.bucketArn">bucketArn</a></code> | <code>string</code> | The ARN of the bucket. |
| <code><a href="#framework.AccessLogsBucket.property.bucketDomainName">bucketDomainName</a></code> | <code>string</code> | The IPv4 DNS name of the specified bucket. |
| <code><a href="#framework.AccessLogsBucket.property.bucketDualStackDomainName">bucketDualStackDomainName</a></code> | <code>string</code> | The IPv6 DNS name of the specified bucket. |
| <code><a href="#framework.AccessLogsBucket.property.bucketName">bucketName</a></code> | <code>string</code> | The name of the bucket. |
| <code><a href="#framework.AccessLogsBucket.property.bucketRegionalDomainName">bucketRegionalDomainName</a></code> | <code>string</code> | The regional domain name of the specified bucket. |
| <code><a href="#framework.AccessLogsBucket.property.bucketWebsiteDomainName">bucketWebsiteDomainName</a></code> | <code>string</code> | The Domain name of the static website. |
| <code><a href="#framework.AccessLogsBucket.property.bucketWebsiteUrl">bucketWebsiteUrl</a></code> | <code>string</code> | The URL of the static website. |
| <code><a href="#framework.AccessLogsBucket.property.encryptionKey">encryptionKey</a></code> | <code>aws-cdk-lib.aws_kms.IKey</code> | Optional KMS encryption key associated with this bucket. |
| <code><a href="#framework.AccessLogsBucket.property.isWebsite">isWebsite</a></code> | <code>boolean</code> | If this bucket has been configured for static website hosting. |
| <code><a href="#framework.AccessLogsBucket.property.policy">policy</a></code> | <code>aws-cdk-lib.aws_s3.BucketPolicy</code> | The resource policy associated with this bucket. |

---

##### `node`<sup>Required</sup> <a name="node" id="framework.AccessLogsBucket.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `env`<sup>Required</sup> <a name="env" id="framework.AccessLogsBucket.property.env"></a>

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

##### `stack`<sup>Required</sup> <a name="stack" id="framework.AccessLogsBucket.property.stack"></a>

```typescript
public readonly stack: Stack;
```

- *Type:* aws-cdk-lib.Stack

The stack in which this resource is defined.

---

##### `bucketArn`<sup>Required</sup> <a name="bucketArn" id="framework.AccessLogsBucket.property.bucketArn"></a>

```typescript
public readonly bucketArn: string;
```

- *Type:* string

The ARN of the bucket.

---

##### `bucketDomainName`<sup>Required</sup> <a name="bucketDomainName" id="framework.AccessLogsBucket.property.bucketDomainName"></a>

```typescript
public readonly bucketDomainName: string;
```

- *Type:* string

The IPv4 DNS name of the specified bucket.

---

##### `bucketDualStackDomainName`<sup>Required</sup> <a name="bucketDualStackDomainName" id="framework.AccessLogsBucket.property.bucketDualStackDomainName"></a>

```typescript
public readonly bucketDualStackDomainName: string;
```

- *Type:* string

The IPv6 DNS name of the specified bucket.

---

##### `bucketName`<sup>Required</sup> <a name="bucketName" id="framework.AccessLogsBucket.property.bucketName"></a>

```typescript
public readonly bucketName: string;
```

- *Type:* string

The name of the bucket.

---

##### `bucketRegionalDomainName`<sup>Required</sup> <a name="bucketRegionalDomainName" id="framework.AccessLogsBucket.property.bucketRegionalDomainName"></a>

```typescript
public readonly bucketRegionalDomainName: string;
```

- *Type:* string

The regional domain name of the specified bucket.

---

##### `bucketWebsiteDomainName`<sup>Required</sup> <a name="bucketWebsiteDomainName" id="framework.AccessLogsBucket.property.bucketWebsiteDomainName"></a>

```typescript
public readonly bucketWebsiteDomainName: string;
```

- *Type:* string

The Domain name of the static website.

---

##### `bucketWebsiteUrl`<sup>Required</sup> <a name="bucketWebsiteUrl" id="framework.AccessLogsBucket.property.bucketWebsiteUrl"></a>

```typescript
public readonly bucketWebsiteUrl: string;
```

- *Type:* string

The URL of the static website.

---

##### `encryptionKey`<sup>Optional</sup> <a name="encryptionKey" id="framework.AccessLogsBucket.property.encryptionKey"></a>

```typescript
public readonly encryptionKey: IKey;
```

- *Type:* aws-cdk-lib.aws_kms.IKey

Optional KMS encryption key associated with this bucket.

---

##### `isWebsite`<sup>Optional</sup> <a name="isWebsite" id="framework.AccessLogsBucket.property.isWebsite"></a>

```typescript
public readonly isWebsite: boolean;
```

- *Type:* boolean

If this bucket has been configured for static website hosting.

---

##### `policy`<sup>Optional</sup> <a name="policy" id="framework.AccessLogsBucket.property.policy"></a>

```typescript
public readonly policy: BucketPolicy;
```

- *Type:* aws-cdk-lib.aws_s3.BucketPolicy

The resource policy associated with this bucket.

If `autoCreatePolicy` is true, a `BucketPolicy` will be created upon the
first call to addToResourcePolicy(s).

---


### AnalyticsBucket <a name="AnalyticsBucket" id="framework.AnalyticsBucket"></a>

An Amazon S3 Bucket configured with best practices and defaults for Analytics: * Server side buckets encryption managed by KMS customer key.

* SSL communication enforcement.
* Access logged to an S3 bucket within a prefix matching the bucket name.
* All public access blocked.
* Two-step protection for bucket and objects deletion.

For custom requirements that are not covered, use {Bucket} directly.

**Usage example**

```typescript
import * as cdk from 'aws-cdk-lib';
import { AnalyticsBucket} from 'aws-data-solutions-framework';

const exampleApp = new cdk.App();
const stack = new cdk.Stack(exampleApp, 'AnalyticsBucketStack');

// Set context value for global data removal policy (or set in cdk.json).
stack.node.setContext('adsf', {'remove_data_on_destroy': 'true'})

const encryptionKey = new Key(stack, 'DataKey', {
removalPolicy: RemovalPolicy.DESTROY,
enableKeyRotation: true,
});

new AnalyticsBucket(stack, 'MyAnalyticsBucket', {
encryptionKey,
removalPolicy: cdk.RemovalPolicy.DESTROY,
});
```

#### Initializers <a name="Initializers" id="framework.AnalyticsBucket.Initializer"></a>

```typescript
import { AnalyticsBucket } from 'framework'

new AnalyticsBucket(scope: Construct, id: string, props: AnalyticsBucketProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#framework.AnalyticsBucket.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | *No description.* |
| <code><a href="#framework.AnalyticsBucket.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#framework.AnalyticsBucket.Initializer.parameter.props">props</a></code> | <code><a href="#framework.AnalyticsBucketProps">AnalyticsBucketProps</a></code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="framework.AnalyticsBucket.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="framework.AnalyticsBucket.Initializer.parameter.id"></a>

- *Type:* string

---

##### `props`<sup>Required</sup> <a name="props" id="framework.AnalyticsBucket.Initializer.parameter.props"></a>

- *Type:* <a href="#framework.AnalyticsBucketProps">AnalyticsBucketProps</a>

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#framework.AnalyticsBucket.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#framework.AnalyticsBucket.applyRemovalPolicy">applyRemovalPolicy</a></code> | Apply the given removal policy to this resource. |
| <code><a href="#framework.AnalyticsBucket.addEventNotification">addEventNotification</a></code> | Adds a bucket notification event destination. |
| <code><a href="#framework.AnalyticsBucket.addObjectCreatedNotification">addObjectCreatedNotification</a></code> | Subscribes a destination to receive notifications when an object is created in the bucket. |
| <code><a href="#framework.AnalyticsBucket.addObjectRemovedNotification">addObjectRemovedNotification</a></code> | Subscribes a destination to receive notifications when an object is removed from the bucket. |
| <code><a href="#framework.AnalyticsBucket.addToResourcePolicy">addToResourcePolicy</a></code> | Adds a statement to the resource policy for a principal (i.e. account/role/service) to perform actions on this bucket and/or its contents. Use `bucketArn` and `arnForObjects(keys)` to obtain ARNs for this bucket or objects. |
| <code><a href="#framework.AnalyticsBucket.arnForObjects">arnForObjects</a></code> | Returns an ARN that represents all objects within the bucket that match the key pattern specified. |
| <code><a href="#framework.AnalyticsBucket.enableEventBridgeNotification">enableEventBridgeNotification</a></code> | Enables event bridge notification, causing all events below to be sent to EventBridge:. |
| <code><a href="#framework.AnalyticsBucket.grantDelete">grantDelete</a></code> | Grants s3:DeleteObject* permission to an IAM principal for objects in this bucket. |
| <code><a href="#framework.AnalyticsBucket.grantPublicAccess">grantPublicAccess</a></code> | Allows unrestricted access to objects from this bucket. |
| <code><a href="#framework.AnalyticsBucket.grantPut">grantPut</a></code> | Grants s3:PutObject* and s3:Abort* permissions for this bucket to an IAM principal. |
| <code><a href="#framework.AnalyticsBucket.grantPutAcl">grantPutAcl</a></code> | Grant the given IAM identity permissions to modify the ACLs of objects in the given Bucket. |
| <code><a href="#framework.AnalyticsBucket.grantRead">grantRead</a></code> | Grant read permissions for this bucket and it's contents to an IAM principal (Role/Group/User). |
| <code><a href="#framework.AnalyticsBucket.grantReadWrite">grantReadWrite</a></code> | Grants read/write permissions for this bucket and it's contents to an IAM principal (Role/Group/User). |
| <code><a href="#framework.AnalyticsBucket.grantWrite">grantWrite</a></code> | Grant write permissions to this bucket to an IAM principal. |
| <code><a href="#framework.AnalyticsBucket.onCloudTrailEvent">onCloudTrailEvent</a></code> | Define a CloudWatch event that triggers when something happens to this repository. |
| <code><a href="#framework.AnalyticsBucket.onCloudTrailPutObject">onCloudTrailPutObject</a></code> | Defines an AWS CloudWatch event that triggers when an object is uploaded to the specified paths (keys) in this bucket using the PutObject API call. |
| <code><a href="#framework.AnalyticsBucket.onCloudTrailWriteObject">onCloudTrailWriteObject</a></code> | Defines an AWS CloudWatch event that triggers when an object at the specified paths (keys) in this bucket are written to. |
| <code><a href="#framework.AnalyticsBucket.s3UrlForObject">s3UrlForObject</a></code> | The S3 URL of an S3 object. For example:. |
| <code><a href="#framework.AnalyticsBucket.transferAccelerationUrlForObject">transferAccelerationUrlForObject</a></code> | The https Transfer Acceleration URL of an S3 object. |
| <code><a href="#framework.AnalyticsBucket.urlForObject">urlForObject</a></code> | The https URL of an S3 object. Specify `regional: false` at the options for non-regional URLs. For example:. |
| <code><a href="#framework.AnalyticsBucket.virtualHostedUrlForObject">virtualHostedUrlForObject</a></code> | The virtual hosted-style URL of an S3 object. Specify `regional: false` at the options for non-regional URL. For example:. |
| <code><a href="#framework.AnalyticsBucket.addCorsRule">addCorsRule</a></code> | Adds a cross-origin access configuration for objects in an Amazon S3 bucket. |
| <code><a href="#framework.AnalyticsBucket.addInventory">addInventory</a></code> | Add an inventory configuration. |
| <code><a href="#framework.AnalyticsBucket.addLifecycleRule">addLifecycleRule</a></code> | Add a lifecycle rule to the bucket. |
| <code><a href="#framework.AnalyticsBucket.addMetric">addMetric</a></code> | Adds a metrics configuration for the CloudWatch request metrics from the bucket. |

---

##### `toString` <a name="toString" id="framework.AnalyticsBucket.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `applyRemovalPolicy` <a name="applyRemovalPolicy" id="framework.AnalyticsBucket.applyRemovalPolicy"></a>

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

###### `policy`<sup>Required</sup> <a name="policy" id="framework.AnalyticsBucket.applyRemovalPolicy.parameter.policy"></a>

- *Type:* aws-cdk-lib.RemovalPolicy

---

##### `addEventNotification` <a name="addEventNotification" id="framework.AnalyticsBucket.addEventNotification"></a>

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


###### `event`<sup>Required</sup> <a name="event" id="framework.AnalyticsBucket.addEventNotification.parameter.event"></a>

- *Type:* aws-cdk-lib.aws_s3.EventType

The event to trigger the notification.

---

###### `dest`<sup>Required</sup> <a name="dest" id="framework.AnalyticsBucket.addEventNotification.parameter.dest"></a>

- *Type:* aws-cdk-lib.aws_s3.IBucketNotificationDestination

The notification destination (Lambda, SNS Topic or SQS Queue).

---

###### `filters`<sup>Required</sup> <a name="filters" id="framework.AnalyticsBucket.addEventNotification.parameter.filters"></a>

- *Type:* aws-cdk-lib.aws_s3.NotificationKeyFilter

S3 object key filter rules to determine which objects trigger this event.

Each filter must include a `prefix` and/or `suffix`
that will be matched against the s3 object key. Refer to the S3 Developer Guide
for details about allowed filter rules.

---

##### `addObjectCreatedNotification` <a name="addObjectCreatedNotification" id="framework.AnalyticsBucket.addObjectCreatedNotification"></a>

```typescript
public addObjectCreatedNotification(dest: IBucketNotificationDestination, filters: NotificationKeyFilter): void
```

Subscribes a destination to receive notifications when an object is created in the bucket.

This is identical to calling
`onEvent(EventType.OBJECT_CREATED)`.

###### `dest`<sup>Required</sup> <a name="dest" id="framework.AnalyticsBucket.addObjectCreatedNotification.parameter.dest"></a>

- *Type:* aws-cdk-lib.aws_s3.IBucketNotificationDestination

The notification destination (see onEvent).

---

###### `filters`<sup>Required</sup> <a name="filters" id="framework.AnalyticsBucket.addObjectCreatedNotification.parameter.filters"></a>

- *Type:* aws-cdk-lib.aws_s3.NotificationKeyFilter

Filters (see onEvent).

---

##### `addObjectRemovedNotification` <a name="addObjectRemovedNotification" id="framework.AnalyticsBucket.addObjectRemovedNotification"></a>

```typescript
public addObjectRemovedNotification(dest: IBucketNotificationDestination, filters: NotificationKeyFilter): void
```

Subscribes a destination to receive notifications when an object is removed from the bucket.

This is identical to calling
`onEvent(EventType.OBJECT_REMOVED)`.

###### `dest`<sup>Required</sup> <a name="dest" id="framework.AnalyticsBucket.addObjectRemovedNotification.parameter.dest"></a>

- *Type:* aws-cdk-lib.aws_s3.IBucketNotificationDestination

The notification destination (see onEvent).

---

###### `filters`<sup>Required</sup> <a name="filters" id="framework.AnalyticsBucket.addObjectRemovedNotification.parameter.filters"></a>

- *Type:* aws-cdk-lib.aws_s3.NotificationKeyFilter

Filters (see onEvent).

---

##### `addToResourcePolicy` <a name="addToResourcePolicy" id="framework.AnalyticsBucket.addToResourcePolicy"></a>

```typescript
public addToResourcePolicy(permission: PolicyStatement): AddToResourcePolicyResult
```

Adds a statement to the resource policy for a principal (i.e. account/role/service) to perform actions on this bucket and/or its contents. Use `bucketArn` and `arnForObjects(keys)` to obtain ARNs for this bucket or objects.

Note that the policy statement may or may not be added to the policy.
For example, when an `IBucket` is created from an existing bucket,
it's not possible to tell whether the bucket already has a policy
attached, let alone to re-use that policy to add more statements to it.
So it's safest to do nothing in these cases.

###### `permission`<sup>Required</sup> <a name="permission" id="framework.AnalyticsBucket.addToResourcePolicy.parameter.permission"></a>

- *Type:* aws-cdk-lib.aws_iam.PolicyStatement

the policy statement to be added to the bucket's policy.

---

##### `arnForObjects` <a name="arnForObjects" id="framework.AnalyticsBucket.arnForObjects"></a>

```typescript
public arnForObjects(keyPattern: string): string
```

Returns an ARN that represents all objects within the bucket that match the key pattern specified.

To represent all keys, specify ``"*"``.

If you need to specify a keyPattern with multiple components, concatenate them into a single string, e.g.:

  arnForObjects(`home/${team}/${user}/*`)

###### `keyPattern`<sup>Required</sup> <a name="keyPattern" id="framework.AnalyticsBucket.arnForObjects.parameter.keyPattern"></a>

- *Type:* string

---

##### `enableEventBridgeNotification` <a name="enableEventBridgeNotification" id="framework.AnalyticsBucket.enableEventBridgeNotification"></a>

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

##### `grantDelete` <a name="grantDelete" id="framework.AnalyticsBucket.grantDelete"></a>

```typescript
public grantDelete(identity: IGrantable, objectsKeyPattern?: any): Grant
```

Grants s3:DeleteObject* permission to an IAM principal for objects in this bucket.

###### `identity`<sup>Required</sup> <a name="identity" id="framework.AnalyticsBucket.grantDelete.parameter.identity"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

The principal.

---

###### `objectsKeyPattern`<sup>Optional</sup> <a name="objectsKeyPattern" id="framework.AnalyticsBucket.grantDelete.parameter.objectsKeyPattern"></a>

- *Type:* any

Restrict the permission to a certain key pattern (default '*').

---

##### `grantPublicAccess` <a name="grantPublicAccess" id="framework.AnalyticsBucket.grantPublicAccess"></a>

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

###### `allowedActions`<sup>Required</sup> <a name="allowedActions" id="framework.AnalyticsBucket.grantPublicAccess.parameter.allowedActions"></a>

- *Type:* string

the set of S3 actions to allow.

Default is "s3:GetObject".

---

###### `keyPrefix`<sup>Optional</sup> <a name="keyPrefix" id="framework.AnalyticsBucket.grantPublicAccess.parameter.keyPrefix"></a>

- *Type:* string

the prefix of S3 object keys (e.g. `home/*`). Default is "*".

---

##### `grantPut` <a name="grantPut" id="framework.AnalyticsBucket.grantPut"></a>

```typescript
public grantPut(identity: IGrantable, objectsKeyPattern?: any): Grant
```

Grants s3:PutObject* and s3:Abort* permissions for this bucket to an IAM principal.

If encryption is used, permission to use the key to encrypt the contents
of written files will also be granted to the same principal.

###### `identity`<sup>Required</sup> <a name="identity" id="framework.AnalyticsBucket.grantPut.parameter.identity"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

The principal.

---

###### `objectsKeyPattern`<sup>Optional</sup> <a name="objectsKeyPattern" id="framework.AnalyticsBucket.grantPut.parameter.objectsKeyPattern"></a>

- *Type:* any

Restrict the permission to a certain key pattern (default '*').

---

##### `grantPutAcl` <a name="grantPutAcl" id="framework.AnalyticsBucket.grantPutAcl"></a>

```typescript
public grantPutAcl(identity: IGrantable, objectsKeyPattern?: string): Grant
```

Grant the given IAM identity permissions to modify the ACLs of objects in the given Bucket.

If your application has the '@aws-cdk/aws-s3:grantWriteWithoutAcl' feature flag set,
calling `grantWrite` or `grantReadWrite` no longer grants permissions to modify the ACLs of the objects;
in this case, if you need to modify object ACLs, call this method explicitly.

###### `identity`<sup>Required</sup> <a name="identity" id="framework.AnalyticsBucket.grantPutAcl.parameter.identity"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

---

###### `objectsKeyPattern`<sup>Optional</sup> <a name="objectsKeyPattern" id="framework.AnalyticsBucket.grantPutAcl.parameter.objectsKeyPattern"></a>

- *Type:* string

---

##### `grantRead` <a name="grantRead" id="framework.AnalyticsBucket.grantRead"></a>

```typescript
public grantRead(identity: IGrantable, objectsKeyPattern?: any): Grant
```

Grant read permissions for this bucket and it's contents to an IAM principal (Role/Group/User).

If encryption is used, permission to use the key to decrypt the contents
of the bucket will also be granted to the same principal.

###### `identity`<sup>Required</sup> <a name="identity" id="framework.AnalyticsBucket.grantRead.parameter.identity"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

The principal.

---

###### `objectsKeyPattern`<sup>Optional</sup> <a name="objectsKeyPattern" id="framework.AnalyticsBucket.grantRead.parameter.objectsKeyPattern"></a>

- *Type:* any

Restrict the permission to a certain key pattern (default '*').

---

##### `grantReadWrite` <a name="grantReadWrite" id="framework.AnalyticsBucket.grantReadWrite"></a>

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

###### `identity`<sup>Required</sup> <a name="identity" id="framework.AnalyticsBucket.grantReadWrite.parameter.identity"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

---

###### `objectsKeyPattern`<sup>Optional</sup> <a name="objectsKeyPattern" id="framework.AnalyticsBucket.grantReadWrite.parameter.objectsKeyPattern"></a>

- *Type:* any

---

##### `grantWrite` <a name="grantWrite" id="framework.AnalyticsBucket.grantWrite"></a>

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

###### `identity`<sup>Required</sup> <a name="identity" id="framework.AnalyticsBucket.grantWrite.parameter.identity"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

---

###### `objectsKeyPattern`<sup>Optional</sup> <a name="objectsKeyPattern" id="framework.AnalyticsBucket.grantWrite.parameter.objectsKeyPattern"></a>

- *Type:* any

---

###### `allowedActionPatterns`<sup>Optional</sup> <a name="allowedActionPatterns" id="framework.AnalyticsBucket.grantWrite.parameter.allowedActionPatterns"></a>

- *Type:* string[]

---

##### `onCloudTrailEvent` <a name="onCloudTrailEvent" id="framework.AnalyticsBucket.onCloudTrailEvent"></a>

```typescript
public onCloudTrailEvent(id: string, options?: OnCloudTrailBucketEventOptions): Rule
```

Define a CloudWatch event that triggers when something happens to this repository.

Requires that there exists at least one CloudTrail Trail in your account
that captures the event. This method will not create the Trail.

###### `id`<sup>Required</sup> <a name="id" id="framework.AnalyticsBucket.onCloudTrailEvent.parameter.id"></a>

- *Type:* string

The id of the rule.

---

###### `options`<sup>Optional</sup> <a name="options" id="framework.AnalyticsBucket.onCloudTrailEvent.parameter.options"></a>

- *Type:* aws-cdk-lib.aws_s3.OnCloudTrailBucketEventOptions

Options for adding the rule.

---

##### `onCloudTrailPutObject` <a name="onCloudTrailPutObject" id="framework.AnalyticsBucket.onCloudTrailPutObject"></a>

```typescript
public onCloudTrailPutObject(id: string, options?: OnCloudTrailBucketEventOptions): Rule
```

Defines an AWS CloudWatch event that triggers when an object is uploaded to the specified paths (keys) in this bucket using the PutObject API call.

Note that some tools like `aws s3 cp` will automatically use either
PutObject or the multipart upload API depending on the file size,
so using `onCloudTrailWriteObject` may be preferable.

Requires that there exists at least one CloudTrail Trail in your account
that captures the event. This method will not create the Trail.

###### `id`<sup>Required</sup> <a name="id" id="framework.AnalyticsBucket.onCloudTrailPutObject.parameter.id"></a>

- *Type:* string

The id of the rule.

---

###### `options`<sup>Optional</sup> <a name="options" id="framework.AnalyticsBucket.onCloudTrailPutObject.parameter.options"></a>

- *Type:* aws-cdk-lib.aws_s3.OnCloudTrailBucketEventOptions

Options for adding the rule.

---

##### `onCloudTrailWriteObject` <a name="onCloudTrailWriteObject" id="framework.AnalyticsBucket.onCloudTrailWriteObject"></a>

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

###### `id`<sup>Required</sup> <a name="id" id="framework.AnalyticsBucket.onCloudTrailWriteObject.parameter.id"></a>

- *Type:* string

The id of the rule.

---

###### `options`<sup>Optional</sup> <a name="options" id="framework.AnalyticsBucket.onCloudTrailWriteObject.parameter.options"></a>

- *Type:* aws-cdk-lib.aws_s3.OnCloudTrailBucketEventOptions

Options for adding the rule.

---

##### `s3UrlForObject` <a name="s3UrlForObject" id="framework.AnalyticsBucket.s3UrlForObject"></a>

```typescript
public s3UrlForObject(key?: string): string
```

The S3 URL of an S3 object. For example:.

`s3://onlybucket`
- `s3://bucket/key`

###### `key`<sup>Optional</sup> <a name="key" id="framework.AnalyticsBucket.s3UrlForObject.parameter.key"></a>

- *Type:* string

The S3 key of the object.

If not specified, the S3 URL of the
bucket is returned.

---

##### `transferAccelerationUrlForObject` <a name="transferAccelerationUrlForObject" id="framework.AnalyticsBucket.transferAccelerationUrlForObject"></a>

```typescript
public transferAccelerationUrlForObject(key?: string, options?: TransferAccelerationUrlOptions): string
```

The https Transfer Acceleration URL of an S3 object.

Specify `dualStack: true` at the options
for dual-stack endpoint (connect to the bucket over IPv6). For example:

- `https://bucket.s3-accelerate.amazonaws.com`
- `https://bucket.s3-accelerate.amazonaws.com/key`

###### `key`<sup>Optional</sup> <a name="key" id="framework.AnalyticsBucket.transferAccelerationUrlForObject.parameter.key"></a>

- *Type:* string

The S3 key of the object.

If not specified, the URL of the
bucket is returned.

---

###### `options`<sup>Optional</sup> <a name="options" id="framework.AnalyticsBucket.transferAccelerationUrlForObject.parameter.options"></a>

- *Type:* aws-cdk-lib.aws_s3.TransferAccelerationUrlOptions

Options for generating URL.

---

##### `urlForObject` <a name="urlForObject" id="framework.AnalyticsBucket.urlForObject"></a>

```typescript
public urlForObject(key?: string): string
```

The https URL of an S3 object. Specify `regional: false` at the options for non-regional URLs. For example:.

`https://s3.us-west-1.amazonaws.com/onlybucket`
- `https://s3.us-west-1.amazonaws.com/bucket/key`
- `https://s3.cn-north-1.amazonaws.com.cn/china-bucket/mykey`

###### `key`<sup>Optional</sup> <a name="key" id="framework.AnalyticsBucket.urlForObject.parameter.key"></a>

- *Type:* string

The S3 key of the object.

If not specified, the URL of the
bucket is returned.

---

##### `virtualHostedUrlForObject` <a name="virtualHostedUrlForObject" id="framework.AnalyticsBucket.virtualHostedUrlForObject"></a>

```typescript
public virtualHostedUrlForObject(key?: string, options?: VirtualHostedStyleUrlOptions): string
```

The virtual hosted-style URL of an S3 object. Specify `regional: false` at the options for non-regional URL. For example:.

`https://only-bucket.s3.us-west-1.amazonaws.com`
- `https://bucket.s3.us-west-1.amazonaws.com/key`
- `https://bucket.s3.amazonaws.com/key`
- `https://china-bucket.s3.cn-north-1.amazonaws.com.cn/mykey`

###### `key`<sup>Optional</sup> <a name="key" id="framework.AnalyticsBucket.virtualHostedUrlForObject.parameter.key"></a>

- *Type:* string

The S3 key of the object.

If not specified, the URL of the
bucket is returned.

---

###### `options`<sup>Optional</sup> <a name="options" id="framework.AnalyticsBucket.virtualHostedUrlForObject.parameter.options"></a>

- *Type:* aws-cdk-lib.aws_s3.VirtualHostedStyleUrlOptions

Options for generating URL.

---

##### `addCorsRule` <a name="addCorsRule" id="framework.AnalyticsBucket.addCorsRule"></a>

```typescript
public addCorsRule(rule: CorsRule): void
```

Adds a cross-origin access configuration for objects in an Amazon S3 bucket.

###### `rule`<sup>Required</sup> <a name="rule" id="framework.AnalyticsBucket.addCorsRule.parameter.rule"></a>

- *Type:* aws-cdk-lib.aws_s3.CorsRule

The CORS configuration rule to add.

---

##### `addInventory` <a name="addInventory" id="framework.AnalyticsBucket.addInventory"></a>

```typescript
public addInventory(inventory: Inventory): void
```

Add an inventory configuration.

###### `inventory`<sup>Required</sup> <a name="inventory" id="framework.AnalyticsBucket.addInventory.parameter.inventory"></a>

- *Type:* aws-cdk-lib.aws_s3.Inventory

configuration to add.

---

##### `addLifecycleRule` <a name="addLifecycleRule" id="framework.AnalyticsBucket.addLifecycleRule"></a>

```typescript
public addLifecycleRule(rule: LifecycleRule): void
```

Add a lifecycle rule to the bucket.

###### `rule`<sup>Required</sup> <a name="rule" id="framework.AnalyticsBucket.addLifecycleRule.parameter.rule"></a>

- *Type:* aws-cdk-lib.aws_s3.LifecycleRule

The rule to add.

---

##### `addMetric` <a name="addMetric" id="framework.AnalyticsBucket.addMetric"></a>

```typescript
public addMetric(metric: BucketMetrics): void
```

Adds a metrics configuration for the CloudWatch request metrics from the bucket.

###### `metric`<sup>Required</sup> <a name="metric" id="framework.AnalyticsBucket.addMetric.parameter.metric"></a>

- *Type:* aws-cdk-lib.aws_s3.BucketMetrics

The metric configuration to add.

---

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#framework.AnalyticsBucket.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |
| <code><a href="#framework.AnalyticsBucket.isOwnedResource">isOwnedResource</a></code> | Returns true if the construct was created by CDK, and false otherwise. |
| <code><a href="#framework.AnalyticsBucket.isResource">isResource</a></code> | Check whether the given construct is a Resource. |
| <code><a href="#framework.AnalyticsBucket.fromBucketArn">fromBucketArn</a></code> | *No description.* |
| <code><a href="#framework.AnalyticsBucket.fromBucketAttributes">fromBucketAttributes</a></code> | Creates a Bucket construct that represents an external bucket. |
| <code><a href="#framework.AnalyticsBucket.fromBucketName">fromBucketName</a></code> | *No description.* |
| <code><a href="#framework.AnalyticsBucket.fromCfnBucket">fromCfnBucket</a></code> | Create a mutable `IBucket` based on a low-level `CfnBucket`. |
| <code><a href="#framework.AnalyticsBucket.validateBucketName">validateBucketName</a></code> | Thrown an exception if the given bucket name is not valid. |

---

##### `isConstruct` <a name="isConstruct" id="framework.AnalyticsBucket.isConstruct"></a>

```typescript
import { AnalyticsBucket } from 'framework'

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

###### `x`<sup>Required</sup> <a name="x" id="framework.AnalyticsBucket.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

##### `isOwnedResource` <a name="isOwnedResource" id="framework.AnalyticsBucket.isOwnedResource"></a>

```typescript
import { AnalyticsBucket } from 'framework'

AnalyticsBucket.isOwnedResource(construct: IConstruct)
```

Returns true if the construct was created by CDK, and false otherwise.

###### `construct`<sup>Required</sup> <a name="construct" id="framework.AnalyticsBucket.isOwnedResource.parameter.construct"></a>

- *Type:* constructs.IConstruct

---

##### `isResource` <a name="isResource" id="framework.AnalyticsBucket.isResource"></a>

```typescript
import { AnalyticsBucket } from 'framework'

AnalyticsBucket.isResource(construct: IConstruct)
```

Check whether the given construct is a Resource.

###### `construct`<sup>Required</sup> <a name="construct" id="framework.AnalyticsBucket.isResource.parameter.construct"></a>

- *Type:* constructs.IConstruct

---

##### `fromBucketArn` <a name="fromBucketArn" id="framework.AnalyticsBucket.fromBucketArn"></a>

```typescript
import { AnalyticsBucket } from 'framework'

AnalyticsBucket.fromBucketArn(scope: Construct, id: string, bucketArn: string)
```

###### `scope`<sup>Required</sup> <a name="scope" id="framework.AnalyticsBucket.fromBucketArn.parameter.scope"></a>

- *Type:* constructs.Construct

---

###### `id`<sup>Required</sup> <a name="id" id="framework.AnalyticsBucket.fromBucketArn.parameter.id"></a>

- *Type:* string

---

###### `bucketArn`<sup>Required</sup> <a name="bucketArn" id="framework.AnalyticsBucket.fromBucketArn.parameter.bucketArn"></a>

- *Type:* string

---

##### `fromBucketAttributes` <a name="fromBucketAttributes" id="framework.AnalyticsBucket.fromBucketAttributes"></a>

```typescript
import { AnalyticsBucket } from 'framework'

AnalyticsBucket.fromBucketAttributes(scope: Construct, id: string, attrs: BucketAttributes)
```

Creates a Bucket construct that represents an external bucket.

###### `scope`<sup>Required</sup> <a name="scope" id="framework.AnalyticsBucket.fromBucketAttributes.parameter.scope"></a>

- *Type:* constructs.Construct

The parent creating construct (usually `this`).

---

###### `id`<sup>Required</sup> <a name="id" id="framework.AnalyticsBucket.fromBucketAttributes.parameter.id"></a>

- *Type:* string

The construct's name.

---

###### `attrs`<sup>Required</sup> <a name="attrs" id="framework.AnalyticsBucket.fromBucketAttributes.parameter.attrs"></a>

- *Type:* aws-cdk-lib.aws_s3.BucketAttributes

A `BucketAttributes` object.

Can be obtained from a call to
`bucket.export()` or manually created.

---

##### `fromBucketName` <a name="fromBucketName" id="framework.AnalyticsBucket.fromBucketName"></a>

```typescript
import { AnalyticsBucket } from 'framework'

AnalyticsBucket.fromBucketName(scope: Construct, id: string, bucketName: string)
```

###### `scope`<sup>Required</sup> <a name="scope" id="framework.AnalyticsBucket.fromBucketName.parameter.scope"></a>

- *Type:* constructs.Construct

---

###### `id`<sup>Required</sup> <a name="id" id="framework.AnalyticsBucket.fromBucketName.parameter.id"></a>

- *Type:* string

---

###### `bucketName`<sup>Required</sup> <a name="bucketName" id="framework.AnalyticsBucket.fromBucketName.parameter.bucketName"></a>

- *Type:* string

---

##### `fromCfnBucket` <a name="fromCfnBucket" id="framework.AnalyticsBucket.fromCfnBucket"></a>

```typescript
import { AnalyticsBucket } from 'framework'

AnalyticsBucket.fromCfnBucket(cfnBucket: CfnBucket)
```

Create a mutable `IBucket` based on a low-level `CfnBucket`.

###### `cfnBucket`<sup>Required</sup> <a name="cfnBucket" id="framework.AnalyticsBucket.fromCfnBucket.parameter.cfnBucket"></a>

- *Type:* aws-cdk-lib.aws_s3.CfnBucket

---

##### `validateBucketName` <a name="validateBucketName" id="framework.AnalyticsBucket.validateBucketName"></a>

```typescript
import { AnalyticsBucket } from 'framework'

AnalyticsBucket.validateBucketName(physicalName: string)
```

Thrown an exception if the given bucket name is not valid.

###### `physicalName`<sup>Required</sup> <a name="physicalName" id="framework.AnalyticsBucket.validateBucketName.parameter.physicalName"></a>

- *Type:* string

name of the bucket.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#framework.AnalyticsBucket.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#framework.AnalyticsBucket.property.env">env</a></code> | <code>aws-cdk-lib.ResourceEnvironment</code> | The environment this resource belongs to. |
| <code><a href="#framework.AnalyticsBucket.property.stack">stack</a></code> | <code>aws-cdk-lib.Stack</code> | The stack in which this resource is defined. |
| <code><a href="#framework.AnalyticsBucket.property.bucketArn">bucketArn</a></code> | <code>string</code> | The ARN of the bucket. |
| <code><a href="#framework.AnalyticsBucket.property.bucketDomainName">bucketDomainName</a></code> | <code>string</code> | The IPv4 DNS name of the specified bucket. |
| <code><a href="#framework.AnalyticsBucket.property.bucketDualStackDomainName">bucketDualStackDomainName</a></code> | <code>string</code> | The IPv6 DNS name of the specified bucket. |
| <code><a href="#framework.AnalyticsBucket.property.bucketName">bucketName</a></code> | <code>string</code> | The name of the bucket. |
| <code><a href="#framework.AnalyticsBucket.property.bucketRegionalDomainName">bucketRegionalDomainName</a></code> | <code>string</code> | The regional domain name of the specified bucket. |
| <code><a href="#framework.AnalyticsBucket.property.bucketWebsiteDomainName">bucketWebsiteDomainName</a></code> | <code>string</code> | The Domain name of the static website. |
| <code><a href="#framework.AnalyticsBucket.property.bucketWebsiteUrl">bucketWebsiteUrl</a></code> | <code>string</code> | The URL of the static website. |
| <code><a href="#framework.AnalyticsBucket.property.encryptionKey">encryptionKey</a></code> | <code>aws-cdk-lib.aws_kms.IKey</code> | Optional KMS encryption key associated with this bucket. |
| <code><a href="#framework.AnalyticsBucket.property.isWebsite">isWebsite</a></code> | <code>boolean</code> | If this bucket has been configured for static website hosting. |
| <code><a href="#framework.AnalyticsBucket.property.policy">policy</a></code> | <code>aws-cdk-lib.aws_s3.BucketPolicy</code> | The resource policy associated with this bucket. |

---

##### `node`<sup>Required</sup> <a name="node" id="framework.AnalyticsBucket.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `env`<sup>Required</sup> <a name="env" id="framework.AnalyticsBucket.property.env"></a>

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

##### `stack`<sup>Required</sup> <a name="stack" id="framework.AnalyticsBucket.property.stack"></a>

```typescript
public readonly stack: Stack;
```

- *Type:* aws-cdk-lib.Stack

The stack in which this resource is defined.

---

##### `bucketArn`<sup>Required</sup> <a name="bucketArn" id="framework.AnalyticsBucket.property.bucketArn"></a>

```typescript
public readonly bucketArn: string;
```

- *Type:* string

The ARN of the bucket.

---

##### `bucketDomainName`<sup>Required</sup> <a name="bucketDomainName" id="framework.AnalyticsBucket.property.bucketDomainName"></a>

```typescript
public readonly bucketDomainName: string;
```

- *Type:* string

The IPv4 DNS name of the specified bucket.

---

##### `bucketDualStackDomainName`<sup>Required</sup> <a name="bucketDualStackDomainName" id="framework.AnalyticsBucket.property.bucketDualStackDomainName"></a>

```typescript
public readonly bucketDualStackDomainName: string;
```

- *Type:* string

The IPv6 DNS name of the specified bucket.

---

##### `bucketName`<sup>Required</sup> <a name="bucketName" id="framework.AnalyticsBucket.property.bucketName"></a>

```typescript
public readonly bucketName: string;
```

- *Type:* string

The name of the bucket.

---

##### `bucketRegionalDomainName`<sup>Required</sup> <a name="bucketRegionalDomainName" id="framework.AnalyticsBucket.property.bucketRegionalDomainName"></a>

```typescript
public readonly bucketRegionalDomainName: string;
```

- *Type:* string

The regional domain name of the specified bucket.

---

##### `bucketWebsiteDomainName`<sup>Required</sup> <a name="bucketWebsiteDomainName" id="framework.AnalyticsBucket.property.bucketWebsiteDomainName"></a>

```typescript
public readonly bucketWebsiteDomainName: string;
```

- *Type:* string

The Domain name of the static website.

---

##### `bucketWebsiteUrl`<sup>Required</sup> <a name="bucketWebsiteUrl" id="framework.AnalyticsBucket.property.bucketWebsiteUrl"></a>

```typescript
public readonly bucketWebsiteUrl: string;
```

- *Type:* string

The URL of the static website.

---

##### `encryptionKey`<sup>Optional</sup> <a name="encryptionKey" id="framework.AnalyticsBucket.property.encryptionKey"></a>

```typescript
public readonly encryptionKey: IKey;
```

- *Type:* aws-cdk-lib.aws_kms.IKey

Optional KMS encryption key associated with this bucket.

---

##### `isWebsite`<sup>Optional</sup> <a name="isWebsite" id="framework.AnalyticsBucket.property.isWebsite"></a>

```typescript
public readonly isWebsite: boolean;
```

- *Type:* boolean

If this bucket has been configured for static website hosting.

---

##### `policy`<sup>Optional</sup> <a name="policy" id="framework.AnalyticsBucket.property.policy"></a>

```typescript
public readonly policy: BucketPolicy;
```

- *Type:* aws-cdk-lib.aws_s3.BucketPolicy

The resource policy associated with this bucket.

If `autoCreatePolicy` is true, a `BucketPolicy` will be created upon the
first call to addToResourcePolicy(s).

---


### ApplicationStack <a name="ApplicationStack" id="framework.ApplicationStack"></a>

The ApplicationStack class that extends a CDK stack with the stage of a CICD pipeline parameter to adapt the behavior.

#### Initializers <a name="Initializers" id="framework.ApplicationStack.Initializer"></a>

```typescript
import { ApplicationStack } from 'framework'

new ApplicationStack(scope: Construct, id: string, props?: ApplicationStackProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#framework.ApplicationStack.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | the Scope of the CDK Construct. |
| <code><a href="#framework.ApplicationStack.Initializer.parameter.id">id</a></code> | <code>string</code> | the ID of the CDK Construct. |
| <code><a href="#framework.ApplicationStack.Initializer.parameter.props">props</a></code> | <code><a href="#framework.ApplicationStackProps">ApplicationStackProps</a></code> | the ApplicationStackProps properties. |

---

##### `scope`<sup>Required</sup> <a name="scope" id="framework.ApplicationStack.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

the Scope of the CDK Construct.

---

##### `id`<sup>Required</sup> <a name="id" id="framework.ApplicationStack.Initializer.parameter.id"></a>

- *Type:* string

the ID of the CDK Construct.

---

##### `props`<sup>Optional</sup> <a name="props" id="framework.ApplicationStack.Initializer.parameter.props"></a>

- *Type:* <a href="#framework.ApplicationStackProps">ApplicationStackProps</a>

the ApplicationStackProps properties.

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#framework.ApplicationStack.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#framework.ApplicationStack.addDependency">addDependency</a></code> | Add a dependency between this stack and another stack. |
| <code><a href="#framework.ApplicationStack.addMetadata">addMetadata</a></code> | Adds an arbitary key-value pair, with information you want to record about the stack. |
| <code><a href="#framework.ApplicationStack.addTransform">addTransform</a></code> | Add a Transform to this stack. A Transform is a macro that AWS CloudFormation uses to process your template. |
| <code><a href="#framework.ApplicationStack.exportStringListValue">exportStringListValue</a></code> | Create a CloudFormation Export for a string list value. |
| <code><a href="#framework.ApplicationStack.exportValue">exportValue</a></code> | Create a CloudFormation Export for a string value. |
| <code><a href="#framework.ApplicationStack.formatArn">formatArn</a></code> | Creates an ARN from components. |
| <code><a href="#framework.ApplicationStack.getLogicalId">getLogicalId</a></code> | Allocates a stack-unique CloudFormation-compatible logical identity for a specific resource. |
| <code><a href="#framework.ApplicationStack.regionalFact">regionalFact</a></code> | Look up a fact value for the given fact for the region of this stack. |
| <code><a href="#framework.ApplicationStack.renameLogicalId">renameLogicalId</a></code> | Rename a generated logical identities. |
| <code><a href="#framework.ApplicationStack.reportMissingContextKey">reportMissingContextKey</a></code> | Indicate that a context key was expected. |
| <code><a href="#framework.ApplicationStack.resolve">resolve</a></code> | Resolve a tokenized value in the context of the current stack. |
| <code><a href="#framework.ApplicationStack.splitArn">splitArn</a></code> | Splits the provided ARN into its components. |
| <code><a href="#framework.ApplicationStack.toJsonString">toJsonString</a></code> | Convert an object, potentially containing tokens, to a JSON string. |
| <code><a href="#framework.ApplicationStack.toYamlString">toYamlString</a></code> | Convert an object, potentially containing tokens, to a YAML string. |

---

##### `toString` <a name="toString" id="framework.ApplicationStack.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `addDependency` <a name="addDependency" id="framework.ApplicationStack.addDependency"></a>

```typescript
public addDependency(target: Stack, reason?: string): void
```

Add a dependency between this stack and another stack.

This can be used to define dependencies between any two stacks within an
app, and also supports nested stacks.

###### `target`<sup>Required</sup> <a name="target" id="framework.ApplicationStack.addDependency.parameter.target"></a>

- *Type:* aws-cdk-lib.Stack

---

###### `reason`<sup>Optional</sup> <a name="reason" id="framework.ApplicationStack.addDependency.parameter.reason"></a>

- *Type:* string

---

##### `addMetadata` <a name="addMetadata" id="framework.ApplicationStack.addMetadata"></a>

```typescript
public addMetadata(key: string, value: any): void
```

Adds an arbitary key-value pair, with information you want to record about the stack.

These get translated to the Metadata section of the generated template.

> [https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/metadata-section-structure.html](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/metadata-section-structure.html)

###### `key`<sup>Required</sup> <a name="key" id="framework.ApplicationStack.addMetadata.parameter.key"></a>

- *Type:* string

---

###### `value`<sup>Required</sup> <a name="value" id="framework.ApplicationStack.addMetadata.parameter.value"></a>

- *Type:* any

---

##### `addTransform` <a name="addTransform" id="framework.ApplicationStack.addTransform"></a>

```typescript
public addTransform(transform: string): void
```

Add a Transform to this stack. A Transform is a macro that AWS CloudFormation uses to process your template.

Duplicate values are removed when stack is synthesized.

> [https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/transform-section-structure.html](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/transform-section-structure.html)

*Example*

```typescript
declare const stack: Stack;

stack.addTransform('AWS::Serverless-2016-10-31')
```


###### `transform`<sup>Required</sup> <a name="transform" id="framework.ApplicationStack.addTransform.parameter.transform"></a>

- *Type:* string

The transform to add.

---

##### `exportStringListValue` <a name="exportStringListValue" id="framework.ApplicationStack.exportStringListValue"></a>

```typescript
public exportStringListValue(exportedValue: any, options?: ExportValueOptions): string[]
```

Create a CloudFormation Export for a string list value.

Returns a string list representing the corresponding `Fn.importValue()`
expression for this Export. The export expression is automatically wrapped with an
`Fn::Join` and the import value with an `Fn::Split`, since CloudFormation can only
export strings. You can control the name for the export by passing the `name` option.

If you don't supply a value for `name`, the value you're exporting must be
a Resource attribute (for example: `bucket.bucketName`) and it will be
given the same name as the automatic cross-stack reference that would be created
if you used the attribute in another Stack.

One of the uses for this method is to *remove* the relationship between
two Stacks established by automatic cross-stack references. It will
temporarily ensure that the CloudFormation Export still exists while you
remove the reference from the consuming stack. After that, you can remove
the resource and the manual export.

See `exportValue` for an example of this process.

###### `exportedValue`<sup>Required</sup> <a name="exportedValue" id="framework.ApplicationStack.exportStringListValue.parameter.exportedValue"></a>

- *Type:* any

---

###### `options`<sup>Optional</sup> <a name="options" id="framework.ApplicationStack.exportStringListValue.parameter.options"></a>

- *Type:* aws-cdk-lib.ExportValueOptions

---

##### `exportValue` <a name="exportValue" id="framework.ApplicationStack.exportValue"></a>

```typescript
public exportValue(exportedValue: any, options?: ExportValueOptions): string
```

Create a CloudFormation Export for a string value.

Returns a string representing the corresponding `Fn.importValue()`
expression for this Export. You can control the name for the export by
passing the `name` option.

If you don't supply a value for `name`, the value you're exporting must be
a Resource attribute (for example: `bucket.bucketName`) and it will be
given the same name as the automatic cross-stack reference that would be created
if you used the attribute in another Stack.

One of the uses for this method is to *remove* the relationship between
two Stacks established by automatic cross-stack references. It will
temporarily ensure that the CloudFormation Export still exists while you
remove the reference from the consuming stack. After that, you can remove
the resource and the manual export.

## Example

Here is how the process works. Let's say there are two stacks,
`producerStack` and `consumerStack`, and `producerStack` has a bucket
called `bucket`, which is referenced by `consumerStack` (perhaps because
an AWS Lambda Function writes into it, or something like that).

It is not safe to remove `producerStack.bucket` because as the bucket is being
deleted, `consumerStack` might still be using it.

Instead, the process takes two deployments:

### Deployment 1: break the relationship

- Make sure `consumerStack` no longer references `bucket.bucketName` (maybe the consumer
  stack now uses its own bucket, or it writes to an AWS DynamoDB table, or maybe you just
  remove the Lambda Function altogether).
- In the `ProducerStack` class, call `this.exportValue(this.bucket.bucketName)`. This
  will make sure the CloudFormation Export continues to exist while the relationship
  between the two stacks is being broken.
- Deploy (this will effectively only change the `consumerStack`, but it's safe to deploy both).

### Deployment 2: remove the bucket resource

- You are now free to remove the `bucket` resource from `producerStack`.
- Don't forget to remove the `exportValue()` call as well.
- Deploy again (this time only the `producerStack` will be changed -- the bucket will be deleted).

###### `exportedValue`<sup>Required</sup> <a name="exportedValue" id="framework.ApplicationStack.exportValue.parameter.exportedValue"></a>

- *Type:* any

---

###### `options`<sup>Optional</sup> <a name="options" id="framework.ApplicationStack.exportValue.parameter.options"></a>

- *Type:* aws-cdk-lib.ExportValueOptions

---

##### `formatArn` <a name="formatArn" id="framework.ApplicationStack.formatArn"></a>

```typescript
public formatArn(components: ArnComponents): string
```

Creates an ARN from components.

If `partition`, `region` or `account` are not specified, the stack's
partition, region and account will be used.

If any component is the empty string, an empty string will be inserted
into the generated ARN at the location that component corresponds to.

The ARN will be formatted as follows:

  arn:{partition}:{service}:{region}:{account}:{resource}{sep}{resource-name}

The required ARN pieces that are omitted will be taken from the stack that
the 'scope' is attached to. If all ARN pieces are supplied, the supplied scope
can be 'undefined'.

###### `components`<sup>Required</sup> <a name="components" id="framework.ApplicationStack.formatArn.parameter.components"></a>

- *Type:* aws-cdk-lib.ArnComponents

---

##### `getLogicalId` <a name="getLogicalId" id="framework.ApplicationStack.getLogicalId"></a>

```typescript
public getLogicalId(element: CfnElement): string
```

Allocates a stack-unique CloudFormation-compatible logical identity for a specific resource.

This method is called when a `CfnElement` is created and used to render the
initial logical identity of resources. Logical ID renames are applied at
this stage.

This method uses the protected method `allocateLogicalId` to render the
logical ID for an element. To modify the naming scheme, extend the `Stack`
class and override this method.

###### `element`<sup>Required</sup> <a name="element" id="framework.ApplicationStack.getLogicalId.parameter.element"></a>

- *Type:* aws-cdk-lib.CfnElement

The CloudFormation element for which a logical identity is needed.

---

##### `regionalFact` <a name="regionalFact" id="framework.ApplicationStack.regionalFact"></a>

```typescript
public regionalFact(factName: string, defaultValue?: string): string
```

Look up a fact value for the given fact for the region of this stack.

Will return a definite value only if the region of the current stack is resolved.
If not, a lookup map will be added to the stack and the lookup will be done at
CDK deployment time.

What regions will be included in the lookup map is controlled by the
`@aws-cdk/core:target-partitions` context value: it must be set to a list
of partitions, and only regions from the given partitions will be included.
If no such context key is set, all regions will be included.

This function is intended to be used by construct library authors. Application
builders can rely on the abstractions offered by construct libraries and do
not have to worry about regional facts.

If `defaultValue` is not given, it is an error if the fact is unknown for
the given region.

###### `factName`<sup>Required</sup> <a name="factName" id="framework.ApplicationStack.regionalFact.parameter.factName"></a>

- *Type:* string

---

###### `defaultValue`<sup>Optional</sup> <a name="defaultValue" id="framework.ApplicationStack.regionalFact.parameter.defaultValue"></a>

- *Type:* string

---

##### `renameLogicalId` <a name="renameLogicalId" id="framework.ApplicationStack.renameLogicalId"></a>

```typescript
public renameLogicalId(oldId: string, newId: string): void
```

Rename a generated logical identities.

To modify the naming scheme strategy, extend the `Stack` class and
override the `allocateLogicalId` method.

###### `oldId`<sup>Required</sup> <a name="oldId" id="framework.ApplicationStack.renameLogicalId.parameter.oldId"></a>

- *Type:* string

---

###### `newId`<sup>Required</sup> <a name="newId" id="framework.ApplicationStack.renameLogicalId.parameter.newId"></a>

- *Type:* string

---

##### `reportMissingContextKey` <a name="reportMissingContextKey" id="framework.ApplicationStack.reportMissingContextKey"></a>

```typescript
public reportMissingContextKey(report: MissingContext): void
```

Indicate that a context key was expected.

Contains instructions which will be emitted into the cloud assembly on how
the key should be supplied.

###### `report`<sup>Required</sup> <a name="report" id="framework.ApplicationStack.reportMissingContextKey.parameter.report"></a>

- *Type:* aws-cdk-lib.cloud_assembly_schema.MissingContext

The set of parameters needed to obtain the context.

---

##### `resolve` <a name="resolve" id="framework.ApplicationStack.resolve"></a>

```typescript
public resolve(obj: any): any
```

Resolve a tokenized value in the context of the current stack.

###### `obj`<sup>Required</sup> <a name="obj" id="framework.ApplicationStack.resolve.parameter.obj"></a>

- *Type:* any

---

##### `splitArn` <a name="splitArn" id="framework.ApplicationStack.splitArn"></a>

```typescript
public splitArn(arn: string, arnFormat: ArnFormat): ArnComponents
```

Splits the provided ARN into its components.

Works both if 'arn' is a string like 'arn:aws:s3:::bucket',
and a Token representing a dynamic CloudFormation expression
(in which case the returned components will also be dynamic CloudFormation expressions,
encoded as Tokens).

###### `arn`<sup>Required</sup> <a name="arn" id="framework.ApplicationStack.splitArn.parameter.arn"></a>

- *Type:* string

the ARN to split into its components.

---

###### `arnFormat`<sup>Required</sup> <a name="arnFormat" id="framework.ApplicationStack.splitArn.parameter.arnFormat"></a>

- *Type:* aws-cdk-lib.ArnFormat

the expected format of 'arn' - depends on what format the service 'arn' represents uses.

---

##### `toJsonString` <a name="toJsonString" id="framework.ApplicationStack.toJsonString"></a>

```typescript
public toJsonString(obj: any, space?: number): string
```

Convert an object, potentially containing tokens, to a JSON string.

###### `obj`<sup>Required</sup> <a name="obj" id="framework.ApplicationStack.toJsonString.parameter.obj"></a>

- *Type:* any

---

###### `space`<sup>Optional</sup> <a name="space" id="framework.ApplicationStack.toJsonString.parameter.space"></a>

- *Type:* number

---

##### `toYamlString` <a name="toYamlString" id="framework.ApplicationStack.toYamlString"></a>

```typescript
public toYamlString(obj: any): string
```

Convert an object, potentially containing tokens, to a YAML string.

###### `obj`<sup>Required</sup> <a name="obj" id="framework.ApplicationStack.toYamlString.parameter.obj"></a>

- *Type:* any

---

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#framework.ApplicationStack.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |
| <code><a href="#framework.ApplicationStack.isStack">isStack</a></code> | Return whether the given object is a Stack. |
| <code><a href="#framework.ApplicationStack.of">of</a></code> | Looks up the first stack scope in which `construct` is defined. |

---

##### `isConstruct` <a name="isConstruct" id="framework.ApplicationStack.isConstruct"></a>

```typescript
import { ApplicationStack } from 'framework'

ApplicationStack.isConstruct(x: any)
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

###### `x`<sup>Required</sup> <a name="x" id="framework.ApplicationStack.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

##### `isStack` <a name="isStack" id="framework.ApplicationStack.isStack"></a>

```typescript
import { ApplicationStack } from 'framework'

ApplicationStack.isStack(x: any)
```

Return whether the given object is a Stack.

We do attribute detection since we can't reliably use 'instanceof'.

###### `x`<sup>Required</sup> <a name="x" id="framework.ApplicationStack.isStack.parameter.x"></a>

- *Type:* any

---

##### `of` <a name="of" id="framework.ApplicationStack.of"></a>

```typescript
import { ApplicationStack } from 'framework'

ApplicationStack.of(construct: IConstruct)
```

Looks up the first stack scope in which `construct` is defined.

Fails if there is no stack up the tree.

###### `construct`<sup>Required</sup> <a name="construct" id="framework.ApplicationStack.of.parameter.construct"></a>

- *Type:* constructs.IConstruct

The construct to start the search from.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#framework.ApplicationStack.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#framework.ApplicationStack.property.account">account</a></code> | <code>string</code> | The AWS account into which this stack will be deployed. |
| <code><a href="#framework.ApplicationStack.property.artifactId">artifactId</a></code> | <code>string</code> | The ID of the cloud assembly artifact for this stack. |
| <code><a href="#framework.ApplicationStack.property.availabilityZones">availabilityZones</a></code> | <code>string[]</code> | Returns the list of AZs that are available in the AWS environment (account/region) associated with this stack. |
| <code><a href="#framework.ApplicationStack.property.bundlingRequired">bundlingRequired</a></code> | <code>boolean</code> | Indicates whether the stack requires bundling or not. |
| <code><a href="#framework.ApplicationStack.property.dependencies">dependencies</a></code> | <code>aws-cdk-lib.Stack[]</code> | Return the stacks this stack depends on. |
| <code><a href="#framework.ApplicationStack.property.environment">environment</a></code> | <code>string</code> | The environment coordinates in which this stack is deployed. |
| <code><a href="#framework.ApplicationStack.property.nested">nested</a></code> | <code>boolean</code> | Indicates if this is a nested stack, in which case `parentStack` will include a reference to it's parent. |
| <code><a href="#framework.ApplicationStack.property.notificationArns">notificationArns</a></code> | <code>string[]</code> | Returns the list of notification Amazon Resource Names (ARNs) for the current stack. |
| <code><a href="#framework.ApplicationStack.property.partition">partition</a></code> | <code>string</code> | The partition in which this stack is defined. |
| <code><a href="#framework.ApplicationStack.property.region">region</a></code> | <code>string</code> | The AWS region into which this stack will be deployed (e.g. `us-west-2`). |
| <code><a href="#framework.ApplicationStack.property.stackId">stackId</a></code> | <code>string</code> | The ID of the stack. |
| <code><a href="#framework.ApplicationStack.property.stackName">stackName</a></code> | <code>string</code> | The concrete CloudFormation physical stack name. |
| <code><a href="#framework.ApplicationStack.property.synthesizer">synthesizer</a></code> | <code>aws-cdk-lib.IStackSynthesizer</code> | Synthesis method for this stack. |
| <code><a href="#framework.ApplicationStack.property.tags">tags</a></code> | <code>aws-cdk-lib.TagManager</code> | Tags to be applied to the stack. |
| <code><a href="#framework.ApplicationStack.property.templateFile">templateFile</a></code> | <code>string</code> | The name of the CloudFormation template file emitted to the output directory during synthesis. |
| <code><a href="#framework.ApplicationStack.property.templateOptions">templateOptions</a></code> | <code>aws-cdk-lib.ITemplateOptions</code> | Options for CloudFormation template (like version, transform, description). |
| <code><a href="#framework.ApplicationStack.property.urlSuffix">urlSuffix</a></code> | <code>string</code> | The Amazon domain suffix for the region in which this stack is defined. |
| <code><a href="#framework.ApplicationStack.property.nestedStackParent">nestedStackParent</a></code> | <code>aws-cdk-lib.Stack</code> | If this is a nested stack, returns it's parent stack. |
| <code><a href="#framework.ApplicationStack.property.nestedStackResource">nestedStackResource</a></code> | <code>aws-cdk-lib.CfnResource</code> | If this is a nested stack, this represents its `AWS::CloudFormation::Stack` resource. |
| <code><a href="#framework.ApplicationStack.property.terminationProtection">terminationProtection</a></code> | <code>boolean</code> | Whether termination protection is enabled for this stack. |

---

##### `node`<sup>Required</sup> <a name="node" id="framework.ApplicationStack.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `account`<sup>Required</sup> <a name="account" id="framework.ApplicationStack.property.account"></a>

```typescript
public readonly account: string;
```

- *Type:* string

The AWS account into which this stack will be deployed.

This value is resolved according to the following rules:

1. The value provided to `env.account` when the stack is defined. This can
   either be a concrete account (e.g. `585695031111`) or the
   `Aws.ACCOUNT_ID` token.
3. `Aws.ACCOUNT_ID`, which represents the CloudFormation intrinsic reference
   `{ "Ref": "AWS::AccountId" }` encoded as a string token.

Preferably, you should use the return value as an opaque string and not
attempt to parse it to implement your logic. If you do, you must first
check that it is a concrete value an not an unresolved token. If this
value is an unresolved token (`Token.isUnresolved(stack.account)` returns
`true`), this implies that the user wishes that this stack will synthesize
into a **account-agnostic template**. In this case, your code should either
fail (throw an error, emit a synth error using `Annotations.of(construct).addError()`) or
implement some other region-agnostic behavior.

---

##### `artifactId`<sup>Required</sup> <a name="artifactId" id="framework.ApplicationStack.property.artifactId"></a>

```typescript
public readonly artifactId: string;
```

- *Type:* string

The ID of the cloud assembly artifact for this stack.

---

##### `availabilityZones`<sup>Required</sup> <a name="availabilityZones" id="framework.ApplicationStack.property.availabilityZones"></a>

```typescript
public readonly availabilityZones: string[];
```

- *Type:* string[]

Returns the list of AZs that are available in the AWS environment (account/region) associated with this stack.

If the stack is environment-agnostic (either account and/or region are
tokens), this property will return an array with 2 tokens that will resolve
at deploy-time to the first two availability zones returned from CloudFormation's
`Fn::GetAZs` intrinsic function.

If they are not available in the context, returns a set of dummy values and
reports them as missing, and let the CLI resolve them by calling EC2
`DescribeAvailabilityZones` on the target environment.

To specify a different strategy for selecting availability zones override this method.

---

##### `bundlingRequired`<sup>Required</sup> <a name="bundlingRequired" id="framework.ApplicationStack.property.bundlingRequired"></a>

```typescript
public readonly bundlingRequired: boolean;
```

- *Type:* boolean

Indicates whether the stack requires bundling or not.

---

##### `dependencies`<sup>Required</sup> <a name="dependencies" id="framework.ApplicationStack.property.dependencies"></a>

```typescript
public readonly dependencies: Stack[];
```

- *Type:* aws-cdk-lib.Stack[]

Return the stacks this stack depends on.

---

##### `environment`<sup>Required</sup> <a name="environment" id="framework.ApplicationStack.property.environment"></a>

```typescript
public readonly environment: string;
```

- *Type:* string

The environment coordinates in which this stack is deployed.

In the form
`aws://account/region`. Use `stack.account` and `stack.region` to obtain
the specific values, no need to parse.

You can use this value to determine if two stacks are targeting the same
environment.

If either `stack.account` or `stack.region` are not concrete values (e.g.
`Aws.ACCOUNT_ID` or `Aws.REGION`) the special strings `unknown-account` and/or
`unknown-region` will be used respectively to indicate this stack is
region/account-agnostic.

---

##### `nested`<sup>Required</sup> <a name="nested" id="framework.ApplicationStack.property.nested"></a>

```typescript
public readonly nested: boolean;
```

- *Type:* boolean

Indicates if this is a nested stack, in which case `parentStack` will include a reference to it's parent.

---

##### `notificationArns`<sup>Required</sup> <a name="notificationArns" id="framework.ApplicationStack.property.notificationArns"></a>

```typescript
public readonly notificationArns: string[];
```

- *Type:* string[]

Returns the list of notification Amazon Resource Names (ARNs) for the current stack.

---

##### `partition`<sup>Required</sup> <a name="partition" id="framework.ApplicationStack.property.partition"></a>

```typescript
public readonly partition: string;
```

- *Type:* string

The partition in which this stack is defined.

---

##### `region`<sup>Required</sup> <a name="region" id="framework.ApplicationStack.property.region"></a>

```typescript
public readonly region: string;
```

- *Type:* string

The AWS region into which this stack will be deployed (e.g. `us-west-2`).

This value is resolved according to the following rules:

1. The value provided to `env.region` when the stack is defined. This can
   either be a concrete region (e.g. `us-west-2`) or the `Aws.REGION`
   token.
3. `Aws.REGION`, which is represents the CloudFormation intrinsic reference
   `{ "Ref": "AWS::Region" }` encoded as a string token.

Preferably, you should use the return value as an opaque string and not
attempt to parse it to implement your logic. If you do, you must first
check that it is a concrete value an not an unresolved token. If this
value is an unresolved token (`Token.isUnresolved(stack.region)` returns
`true`), this implies that the user wishes that this stack will synthesize
into a **region-agnostic template**. In this case, your code should either
fail (throw an error, emit a synth error using `Annotations.of(construct).addError()`) or
implement some other region-agnostic behavior.

---

##### `stackId`<sup>Required</sup> <a name="stackId" id="framework.ApplicationStack.property.stackId"></a>

```typescript
public readonly stackId: string;
```

- *Type:* string

The ID of the stack.

---

*Example*

```typescript
// After resolving, looks like
'arn:aws:cloudformation:us-west-2:123456789012:stack/teststack/51af3dc0-da77-11e4-872e-1234567db123'
```


##### `stackName`<sup>Required</sup> <a name="stackName" id="framework.ApplicationStack.property.stackName"></a>

```typescript
public readonly stackName: string;
```

- *Type:* string

The concrete CloudFormation physical stack name.

This is either the name defined explicitly in the `stackName` prop or
allocated based on the stack's location in the construct tree. Stacks that
are directly defined under the app use their construct `id` as their stack
name. Stacks that are defined deeper within the tree will use a hashed naming
scheme based on the construct path to ensure uniqueness.

If you wish to obtain the deploy-time AWS::StackName intrinsic,
you can use `Aws.STACK_NAME` directly.

---

##### `synthesizer`<sup>Required</sup> <a name="synthesizer" id="framework.ApplicationStack.property.synthesizer"></a>

```typescript
public readonly synthesizer: IStackSynthesizer;
```

- *Type:* aws-cdk-lib.IStackSynthesizer

Synthesis method for this stack.

---

##### `tags`<sup>Required</sup> <a name="tags" id="framework.ApplicationStack.property.tags"></a>

```typescript
public readonly tags: TagManager;
```

- *Type:* aws-cdk-lib.TagManager

Tags to be applied to the stack.

---

##### `templateFile`<sup>Required</sup> <a name="templateFile" id="framework.ApplicationStack.property.templateFile"></a>

```typescript
public readonly templateFile: string;
```

- *Type:* string

The name of the CloudFormation template file emitted to the output directory during synthesis.

Example value: `MyStack.template.json`

---

##### `templateOptions`<sup>Required</sup> <a name="templateOptions" id="framework.ApplicationStack.property.templateOptions"></a>

```typescript
public readonly templateOptions: ITemplateOptions;
```

- *Type:* aws-cdk-lib.ITemplateOptions

Options for CloudFormation template (like version, transform, description).

---

##### `urlSuffix`<sup>Required</sup> <a name="urlSuffix" id="framework.ApplicationStack.property.urlSuffix"></a>

```typescript
public readonly urlSuffix: string;
```

- *Type:* string

The Amazon domain suffix for the region in which this stack is defined.

---

##### `nestedStackParent`<sup>Optional</sup> <a name="nestedStackParent" id="framework.ApplicationStack.property.nestedStackParent"></a>

```typescript
public readonly nestedStackParent: Stack;
```

- *Type:* aws-cdk-lib.Stack

If this is a nested stack, returns it's parent stack.

---

##### `nestedStackResource`<sup>Optional</sup> <a name="nestedStackResource" id="framework.ApplicationStack.property.nestedStackResource"></a>

```typescript
public readonly nestedStackResource: CfnResource;
```

- *Type:* aws-cdk-lib.CfnResource

If this is a nested stack, this represents its `AWS::CloudFormation::Stack` resource.

`undefined` for top-level (non-nested) stacks.

---

##### `terminationProtection`<sup>Optional</sup> <a name="terminationProtection" id="framework.ApplicationStack.property.terminationProtection"></a>

```typescript
public readonly terminationProtection: boolean;
```

- *Type:* boolean

Whether termination protection is enabled for this stack.

---


### DataCatalogDatabase <a name="DataCatalogDatabase" id="framework.DataCatalogDatabase"></a>

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
import { DataLakeStorage } from 'aws-data-solutions-framework';

// Set context value for global data removal policy (or set in cdk.json).
this.node.setContext('adsf', {'remove_data_on_destroy': 'true'})

new DataLakeStorage(this, 'MyDataLakeStorage', {
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

#### Initializers <a name="Initializers" id="framework.DataLakeStorage.Initializer"></a>

```typescript
import { DataLakeStorage } from 'framework'

new DataLakeCatalog(scope: Construct, id: string, props: DataLakeCatalogProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#framework.DataLakeStorage.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | the Scope of the CDK Construct. |
| <code><a href="#framework.DataLakeStorage.Initializer.parameter.id">id</a></code> | <code>string</code> | the ID of the CDK Construct. |
| <code><a href="#framework.DataLakeStorage.Initializer.parameter.props">props</a></code> | <code><a href="#framework.DataLakeStorageProps">DataLakeStorageProps</a></code> | the DataLakeStorageProps properties. |

---

##### `scope`<sup>Required</sup> <a name="scope" id="framework.DataLakeStorage.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

the Scope of the CDK Construct.

---

##### `id`<sup>Required</sup> <a name="id" id="framework.DataLakeStorage.Initializer.parameter.id"></a>

- *Type:* string

the ID of the CDK Construct.

---

##### `props`<sup>Optional</sup> <a name="props" id="framework.DataLakeStorage.Initializer.parameter.props"></a>

- *Type:* <a href="#framework.DataLakeStorageProps">DataLakeStorageProps</a>

the DataLakeCatalog properties.

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#framework.DataLakeStorage.toString">toString</a></code> | Returns a string representation of this construct. |

---

##### `toString` <a name="toString" id="framework.DataLakeStorage.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#framework.DataLakeStorage.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |

---

##### `isConstruct` <a name="isConstruct" id="framework.DataLakeStorage.isConstruct"></a>

```typescript
import { DataLakeStorage } from 'framework'

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

###### `x`<sup>Required</sup> <a name="x" id="framework.DataLakeStorage.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#framework.DataLakeStorage.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#framework.DataLakeStorage.property.accessLogsBucket">accessLogsBucket</a></code> | <code><a href="#framework.AccessLogsBucket">AccessLogsBucket</a></code> | *No description.* |
| <code><a href="#framework.DataLakeStorage.property.bronzeBucket">bronzeBucket</a></code> | <code><a href="#framework.AnalyticsBucket">AnalyticsBucket</a></code> | *No description.* |
| <code><a href="#framework.DataLakeStorage.property.dataLakeKey">dataLakeKey</a></code> | <code>aws-cdk-lib.aws_kms.Key</code> | *No description.* |
| <code><a href="#framework.DataLakeStorage.property.goldBucket">goldBucket</a></code> | <code><a href="#framework.AnalyticsBucket">AnalyticsBucket</a></code> | *No description.* |
| <code><a href="#framework.DataLakeStorage.property.silverBucket">silverBucket</a></code> | <code><a href="#framework.AnalyticsBucket">AnalyticsBucket</a></code> | *No description.* |

---

##### `node`<sup>Required</sup> <a name="node" id="framework.DataLakeStorage.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `accessLogsBucket`<sup>Required</sup> <a name="accessLogsBucket" id="framework.DataLakeStorage.property.accessLogsBucket"></a>

```typescript
public readonly accessLogsBucket: AccessLogsBucket;
```

- *Type:* <a href="#framework.AccessLogsBucket">AccessLogsBucket</a>

---

##### `bronzeBucket`<sup>Required</sup> <a name="bronzeBucket" id="framework.DataLakeStorage.property.bronzeBucket"></a>

```typescript
public readonly bronzeBucket: AnalyticsBucket;
```

- *Type:* <a href="#framework.AnalyticsBucket">AnalyticsBucket</a>

---

##### `dataLakeKey`<sup>Required</sup> <a name="dataLakeKey" id="framework.DataLakeStorage.property.dataLakeKey"></a>

```typescript
public readonly dataLakeKey: Key;
```

- *Type:* aws-cdk-lib.aws_kms.Key

---

##### `goldBucket`<sup>Required</sup> <a name="goldBucket" id="framework.DataLakeStorage.property.goldBucket"></a>

```typescript
public readonly goldBucket: AnalyticsBucket;
```

- *Type:* <a href="#framework.AnalyticsBucket">AnalyticsBucket</a>

---

##### `silverBucket`<sup>Required</sup> <a name="silverBucket" id="framework.DataLakeStorage.property.silverBucket"></a>

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

the ID of the CDK Construct.

---

##### `props`<sup>Required</sup> <a name="props" id="framework.SparkCICDPipeline.Initializer.parameter.props"></a>

- *Type:* <a href="#framework.SparkCICDPipelineProps">SparkCICDPipelineProps</a>

the SparkCICDPipelineProps properties.

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#framework.SparkCICDPipeline.toString">toString</a></code> | Returns a string representation of this construct. |

---

##### `toString` <a name="toString" id="framework.SparkCICDPipeline.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#framework.SparkCICDPipeline.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |

---

##### `isConstruct` <a name="isConstruct" id="framework.SparkCICDPipeline.isConstruct"></a>

```typescript
import { SparkCICDPipeline } from 'framework'

SparkCICDPipeline.isConstruct(x: any)
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

###### `x`<sup>Required</sup> <a name="x" id="framework.SparkCICDPipeline.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#framework.SparkCICDPipeline.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#framework.SparkCICDPipeline.property.pipeline">pipeline</a></code> | <code>aws-cdk-lib.pipelines.CodePipeline</code> | The CodePipeline created as part of the Spark CICD Pipeline. |

---

##### `node`<sup>Required</sup> <a name="node" id="framework.SparkCICDPipeline.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `pipeline`<sup>Required</sup> <a name="pipeline" id="framework.SparkCICDPipeline.property.pipeline"></a>

```typescript
public readonly pipeline: CodePipeline;
```

- *Type:* aws-cdk-lib.pipelines.CodePipeline

The CodePipeline created as part of the Spark CICD Pipeline.

---


### SparkRuntimeServerless <a name="SparkRuntimeServerless" id="framework.SparkRuntimeServerless"></a>

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

### AnalyticsBucketProps <a name="AnalyticsBucketProps" id="framework.AnalyticsBucketProps"></a>

Properties of the {@link AnalyticsBucket } construct.

#### Initializer <a name="Initializer" id="framework.AnalyticsBucketProps.Initializer"></a>

```typescript
import { AnalyticsBucketProps } from 'framework'

const analyticsBucketProps: AnalyticsBucketProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#framework.AnalyticsBucketProps.property.encryptionKey">encryptionKey</a></code> | <code>aws-cdk-lib.aws_kms.IKey</code> | External KMS key to use for bucket encryption. |
| <code><a href="#framework.AnalyticsBucketProps.property.accessControl">accessControl</a></code> | <code>aws-cdk-lib.aws_s3.BucketAccessControl</code> | Specifies a canned ACL that grants predefined permissions to the bucket. |
| <code><a href="#framework.AnalyticsBucketProps.property.autoDeleteObjects">autoDeleteObjects</a></code> | <code>boolean</code> | Whether all objects should be automatically deleted when the bucket is removed from the stack or when the stack is deleted. |
| <code><a href="#framework.AnalyticsBucketProps.property.blockPublicAccess">blockPublicAccess</a></code> | <code>aws-cdk-lib.aws_s3.BlockPublicAccess</code> | The block public access configuration of this bucket. |
| <code><a href="#framework.AnalyticsBucketProps.property.bucketKeyEnabled">bucketKeyEnabled</a></code> | <code>boolean</code> | Whether Amazon S3 should use its own intermediary key to generate data keys. Only relevant when using KMS for encryption. |
| <code><a href="#framework.AnalyticsBucketProps.property.bucketName">bucketName</a></code> | <code>string</code> | Physical name of this bucket. |
| <code><a href="#framework.AnalyticsBucketProps.property.cors">cors</a></code> | <code>aws-cdk-lib.aws_s3.CorsRule[]</code> | The CORS configuration of this bucket. |
| <code><a href="#framework.AnalyticsBucketProps.property.enforceSSL">enforceSSL</a></code> | <code>boolean</code> | Enforces SSL for requests. |
| <code><a href="#framework.AnalyticsBucketProps.property.eventBridgeEnabled">eventBridgeEnabled</a></code> | <code>boolean</code> | Whether this bucket should send notifications to Amazon EventBridge or not. |
| <code><a href="#framework.AnalyticsBucketProps.property.intelligentTieringConfigurations">intelligentTieringConfigurations</a></code> | <code>aws-cdk-lib.aws_s3.IntelligentTieringConfiguration[]</code> | Inteligent Tiering Configurations. |
| <code><a href="#framework.AnalyticsBucketProps.property.inventories">inventories</a></code> | <code>aws-cdk-lib.aws_s3.Inventory[]</code> | The inventory configuration of the bucket. |
| <code><a href="#framework.AnalyticsBucketProps.property.lifecycleRules">lifecycleRules</a></code> | <code>aws-cdk-lib.aws_s3.LifecycleRule[]</code> | Rules that define how Amazon S3 manages objects during their lifetime. |
| <code><a href="#framework.AnalyticsBucketProps.property.metrics">metrics</a></code> | <code>aws-cdk-lib.aws_s3.BucketMetrics[]</code> | The metrics configuration of this bucket. |
| <code><a href="#framework.AnalyticsBucketProps.property.notificationsHandlerRole">notificationsHandlerRole</a></code> | <code>aws-cdk-lib.aws_iam.IRole</code> | The role to be used by the notifications handler. |
| <code><a href="#framework.AnalyticsBucketProps.property.objectLockDefaultRetention">objectLockDefaultRetention</a></code> | <code>aws-cdk-lib.aws_s3.ObjectLockRetention</code> | The default retention mode and rules for S3 Object Lock. |
| <code><a href="#framework.AnalyticsBucketProps.property.objectLockEnabled">objectLockEnabled</a></code> | <code>boolean</code> | Enable object lock on the bucket. |
| <code><a href="#framework.AnalyticsBucketProps.property.objectOwnership">objectOwnership</a></code> | <code>aws-cdk-lib.aws_s3.ObjectOwnership</code> | The objectOwnership of the bucket. |
| <code><a href="#framework.AnalyticsBucketProps.property.publicReadAccess">publicReadAccess</a></code> | <code>boolean</code> | Grants public read access to all objects in the bucket. |
| <code><a href="#framework.AnalyticsBucketProps.property.removalPolicy">removalPolicy</a></code> | <code>aws-cdk-lib.RemovalPolicy</code> | Policy to apply when the bucket is removed from this stack. |
| <code><a href="#framework.AnalyticsBucketProps.property.serverAccessLogsBucket">serverAccessLogsBucket</a></code> | <code>aws-cdk-lib.aws_s3.IBucket</code> | Destination bucket for the server access logs. |
| <code><a href="#framework.AnalyticsBucketProps.property.serverAccessLogsPrefix">serverAccessLogsPrefix</a></code> | <code>string</code> | Optional log file prefix to use for the bucket's access logs. |
| <code><a href="#framework.AnalyticsBucketProps.property.transferAcceleration">transferAcceleration</a></code> | <code>boolean</code> | Whether this bucket should have transfer acceleration turned on or not. |
| <code><a href="#framework.AnalyticsBucketProps.property.versioned">versioned</a></code> | <code>boolean</code> | Whether this bucket should have versioning turned on or not. |

---

##### `encryptionKey`<sup>Required</sup> <a name="encryptionKey" id="framework.AnalyticsBucketProps.property.encryptionKey"></a>

```typescript
public readonly encryptionKey: IKey;
```

- *Type:* aws-cdk-lib.aws_kms.IKey
- *Default:* If `encryption` is set to `KMS` and this property is undefined, a new KMS key will be created and associated with this bucket.

External KMS key to use for bucket encryption.

The `encryption` property must be either not specified or set to `KMS` or `DSSE`.
An error will be emitted if `encryption` is set to `UNENCRYPTED` or `S3_MANAGED`.

---

##### `accessControl`<sup>Optional</sup> <a name="accessControl" id="framework.AnalyticsBucketProps.property.accessControl"></a>

```typescript
public readonly accessControl: BucketAccessControl;
```

- *Type:* aws-cdk-lib.aws_s3.BucketAccessControl
- *Default:* BucketAccessControl.PRIVATE

Specifies a canned ACL that grants predefined permissions to the bucket.

---

##### `autoDeleteObjects`<sup>Optional</sup> <a name="autoDeleteObjects" id="framework.AnalyticsBucketProps.property.autoDeleteObjects"></a>

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

##### `blockPublicAccess`<sup>Optional</sup> <a name="blockPublicAccess" id="framework.AnalyticsBucketProps.property.blockPublicAccess"></a>

```typescript
public readonly blockPublicAccess: BlockPublicAccess;
```

- *Type:* aws-cdk-lib.aws_s3.BlockPublicAccess
- *Default:* CloudFormation defaults will apply. New buckets and objects don't allow public access, but users can modify bucket policies or object permissions to allow public access

The block public access configuration of this bucket.

---

##### `bucketKeyEnabled`<sup>Optional</sup> <a name="bucketKeyEnabled" id="framework.AnalyticsBucketProps.property.bucketKeyEnabled"></a>

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

##### `bucketName`<sup>Optional</sup> <a name="bucketName" id="framework.AnalyticsBucketProps.property.bucketName"></a>

```typescript
public readonly bucketName: string;
```

- *Type:* string
- *Default:* Assigned by CloudFormation (recommended).

Physical name of this bucket.

---

##### `cors`<sup>Optional</sup> <a name="cors" id="framework.AnalyticsBucketProps.property.cors"></a>

```typescript
public readonly cors: CorsRule[];
```

- *Type:* aws-cdk-lib.aws_s3.CorsRule[]
- *Default:* No CORS configuration.

The CORS configuration of this bucket.

---

##### `enforceSSL`<sup>Optional</sup> <a name="enforceSSL" id="framework.AnalyticsBucketProps.property.enforceSSL"></a>

```typescript
public readonly enforceSSL: boolean;
```

- *Type:* boolean
- *Default:* false

Enforces SSL for requests.

S3.5 of the AWS Foundational Security Best Practices Regarding S3.

---

##### `eventBridgeEnabled`<sup>Optional</sup> <a name="eventBridgeEnabled" id="framework.AnalyticsBucketProps.property.eventBridgeEnabled"></a>

```typescript
public readonly eventBridgeEnabled: boolean;
```

- *Type:* boolean
- *Default:* false

Whether this bucket should send notifications to Amazon EventBridge or not.

---

##### `intelligentTieringConfigurations`<sup>Optional</sup> <a name="intelligentTieringConfigurations" id="framework.AnalyticsBucketProps.property.intelligentTieringConfigurations"></a>

```typescript
public readonly intelligentTieringConfigurations: IntelligentTieringConfiguration[];
```

- *Type:* aws-cdk-lib.aws_s3.IntelligentTieringConfiguration[]
- *Default:* No Intelligent Tiiering Configurations.

Inteligent Tiering Configurations.

---

##### `inventories`<sup>Optional</sup> <a name="inventories" id="framework.AnalyticsBucketProps.property.inventories"></a>

```typescript
public readonly inventories: Inventory[];
```

- *Type:* aws-cdk-lib.aws_s3.Inventory[]
- *Default:* No inventory configuration

The inventory configuration of the bucket.

---

##### `lifecycleRules`<sup>Optional</sup> <a name="lifecycleRules" id="framework.AnalyticsBucketProps.property.lifecycleRules"></a>

```typescript
public readonly lifecycleRules: LifecycleRule[];
```

- *Type:* aws-cdk-lib.aws_s3.LifecycleRule[]
- *Default:* No lifecycle rules.

Rules that define how Amazon S3 manages objects during their lifetime.

---

##### `metrics`<sup>Optional</sup> <a name="metrics" id="framework.AnalyticsBucketProps.property.metrics"></a>

```typescript
public readonly metrics: BucketMetrics[];
```

- *Type:* aws-cdk-lib.aws_s3.BucketMetrics[]
- *Default:* No metrics configuration.

The metrics configuration of this bucket.

---

##### `notificationsHandlerRole`<sup>Optional</sup> <a name="notificationsHandlerRole" id="framework.AnalyticsBucketProps.property.notificationsHandlerRole"></a>

```typescript
public readonly notificationsHandlerRole: IRole;
```

- *Type:* aws-cdk-lib.aws_iam.IRole
- *Default:* a new role will be created.

The role to be used by the notifications handler.

---

##### `objectLockDefaultRetention`<sup>Optional</sup> <a name="objectLockDefaultRetention" id="framework.AnalyticsBucketProps.property.objectLockDefaultRetention"></a>

```typescript
public readonly objectLockDefaultRetention: ObjectLockRetention;
```

- *Type:* aws-cdk-lib.aws_s3.ObjectLockRetention
- *Default:* no default retention period

The default retention mode and rules for S3 Object Lock.

Default retention can be configured after a bucket is created if the bucket already
has object lock enabled. Enabling object lock for existing buckets is not supported.

---

##### `objectLockEnabled`<sup>Optional</sup> <a name="objectLockEnabled" id="framework.AnalyticsBucketProps.property.objectLockEnabled"></a>

```typescript
public readonly objectLockEnabled: boolean;
```

- *Type:* boolean
- *Default:* false, unless objectLockDefaultRetention is set (then, true)

Enable object lock on the bucket.

Enabling object lock for existing buckets is not supported. Object lock must be
enabled when the bucket is created.

---

##### `objectOwnership`<sup>Optional</sup> <a name="objectOwnership" id="framework.AnalyticsBucketProps.property.objectOwnership"></a>

```typescript
public readonly objectOwnership: ObjectOwnership;
```

- *Type:* aws-cdk-lib.aws_s3.ObjectOwnership
- *Default:* No ObjectOwnership configuration, uploading account will own the object.

The objectOwnership of the bucket.

---

##### `publicReadAccess`<sup>Optional</sup> <a name="publicReadAccess" id="framework.AnalyticsBucketProps.property.publicReadAccess"></a>

```typescript
public readonly publicReadAccess: boolean;
```

- *Type:* boolean
- *Default:* false

Grants public read access to all objects in the bucket.

Similar to calling `bucket.grantPublicAccess()`

---

##### `removalPolicy`<sup>Optional</sup> <a name="removalPolicy" id="framework.AnalyticsBucketProps.property.removalPolicy"></a>

```typescript
public readonly removalPolicy: RemovalPolicy;
```

- *Type:* aws-cdk-lib.RemovalPolicy

Policy to apply when the bucket is removed from this stack.

* @default - RETAIN (The bucket will be orphaned).

---

##### `serverAccessLogsBucket`<sup>Optional</sup> <a name="serverAccessLogsBucket" id="framework.AnalyticsBucketProps.property.serverAccessLogsBucket"></a>

```typescript
public readonly serverAccessLogsBucket: IBucket;
```

- *Type:* aws-cdk-lib.aws_s3.IBucket
- *Default:* If "serverAccessLogsPrefix" undefined - access logs disabled, otherwise - log to current bucket.

Destination bucket for the server access logs.

---

##### `serverAccessLogsPrefix`<sup>Optional</sup> <a name="serverAccessLogsPrefix" id="framework.AnalyticsBucketProps.property.serverAccessLogsPrefix"></a>

```typescript
public readonly serverAccessLogsPrefix: string;
```

- *Type:* string
- *Default:* No log file prefix

Optional log file prefix to use for the bucket's access logs.

If defined without "serverAccessLogsBucket", enables access logs to current bucket with this prefix.

---

##### `transferAcceleration`<sup>Optional</sup> <a name="transferAcceleration" id="framework.AnalyticsBucketProps.property.transferAcceleration"></a>

```typescript
public readonly transferAcceleration: boolean;
```

- *Type:* boolean
- *Default:* false

Whether this bucket should have transfer acceleration turned on or not.

---

##### `versioned`<sup>Optional</sup> <a name="versioned" id="framework.AnalyticsBucketProps.property.versioned"></a>

```typescript
public readonly versioned: boolean;
```

- *Type:* boolean
- *Default:* false (unless object lock is enabled, then true)

Whether this bucket should have versioning turned on or not.

---

### ApplicationStackProps <a name="ApplicationStackProps" id="framework.ApplicationStackProps"></a>

Properties for the ApplicationStack class.

#### Initializer <a name="Initializer" id="framework.ApplicationStackProps.Initializer"></a>

```typescript
import { ApplicationStackProps } from 'framework'

const applicationStackProps: ApplicationStackProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#framework.ApplicationStackProps.property.analyticsReporting">analyticsReporting</a></code> | <code>boolean</code> | Include runtime versioning information in this Stack. |
| <code><a href="#framework.ApplicationStackProps.property.crossRegionReferences">crossRegionReferences</a></code> | <code>boolean</code> | Enable this flag to allow native cross region stack references. |
| <code><a href="#framework.ApplicationStackProps.property.description">description</a></code> | <code>string</code> | A description of the stack. |
| <code><a href="#framework.ApplicationStackProps.property.env">env</a></code> | <code>aws-cdk-lib.Environment</code> | The AWS environment (account/region) where this stack will be deployed. |
| <code><a href="#framework.ApplicationStackProps.property.permissionsBoundary">permissionsBoundary</a></code> | <code>aws-cdk-lib.PermissionsBoundary</code> | Options for applying a permissions boundary to all IAM Roles and Users created within this Stage. |
| <code><a href="#framework.ApplicationStackProps.property.stackName">stackName</a></code> | <code>string</code> | Name to deploy the stack with. |
| <code><a href="#framework.ApplicationStackProps.property.synthesizer">synthesizer</a></code> | <code>aws-cdk-lib.IStackSynthesizer</code> | Synthesis method to use while deploying this stack. |
| <code><a href="#framework.ApplicationStackProps.property.tags">tags</a></code> | <code>{[ key: string ]: string}</code> | Stack tags that will be applied to all the taggable resources and the stack itself. |
| <code><a href="#framework.ApplicationStackProps.property.terminationProtection">terminationProtection</a></code> | <code>boolean</code> | Whether to enable termination protection for this stack. |
| <code><a href="#framework.ApplicationStackProps.property.stage">stage</a></code> | <code><a href="#framework.CICDStage">CICDStage</a></code> | The stage of the CICD pipeline used to change the behavior of the stack. |

---

##### `analyticsReporting`<sup>Optional</sup> <a name="analyticsReporting" id="framework.ApplicationStackProps.property.analyticsReporting"></a>

```typescript
public readonly analyticsReporting: boolean;
```

- *Type:* boolean
- *Default:* `analyticsReporting` setting of containing `App`, or value of 'aws:cdk:version-reporting' context key

Include runtime versioning information in this Stack.

---

##### `crossRegionReferences`<sup>Optional</sup> <a name="crossRegionReferences" id="framework.ApplicationStackProps.property.crossRegionReferences"></a>

```typescript
public readonly crossRegionReferences: boolean;
```

- *Type:* boolean
- *Default:* false

Enable this flag to allow native cross region stack references.

Enabling this will create a CloudFormation custom resource
in both the producing stack and consuming stack in order to perform the export/import

This feature is currently experimental

---

##### `description`<sup>Optional</sup> <a name="description" id="framework.ApplicationStackProps.property.description"></a>

```typescript
public readonly description: string;
```

- *Type:* string
- *Default:* No description.

A description of the stack.

---

##### `env`<sup>Optional</sup> <a name="env" id="framework.ApplicationStackProps.property.env"></a>

```typescript
public readonly env: Environment;
```

- *Type:* aws-cdk-lib.Environment
- *Default:* The environment of the containing `Stage` if available, otherwise create the stack will be environment-agnostic.

The AWS environment (account/region) where this stack will be deployed.

Set the `region`/`account` fields of `env` to either a concrete value to
select the indicated environment (recommended for production stacks), or to
the values of environment variables
`CDK_DEFAULT_REGION`/`CDK_DEFAULT_ACCOUNT` to let the target environment
depend on the AWS credentials/configuration that the CDK CLI is executed
under (recommended for development stacks).

If the `Stack` is instantiated inside a `Stage`, any undefined
`region`/`account` fields from `env` will default to the same field on the
encompassing `Stage`, if configured there.

If either `region` or `account` are not set nor inherited from `Stage`, the
Stack will be considered "*environment-agnostic*"". Environment-agnostic
stacks can be deployed to any environment but may not be able to take
advantage of all features of the CDK. For example, they will not be able to
use environmental context lookups such as `ec2.Vpc.fromLookup` and will not
automatically translate Service Principals to the right format based on the
environment's AWS partition, and other such enhancements.

---

*Example*

```typescript
// Use a concrete account and region to deploy this stack to:
// `.account` and `.region` will simply return these values.
new Stack(app, 'Stack1', {
  env: {
    account: '123456789012',
    region: 'us-east-1'
  },
});

// Use the CLI's current credentials to determine the target environment:
// `.account` and `.region` will reflect the account+region the CLI
// is configured to use (based on the user CLI credentials)
new Stack(app, 'Stack2', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  },
});

// Define multiple stacks stage associated with an environment
const myStage = new Stage(app, 'MyStage', {
  env: {
    account: '123456789012',
    region: 'us-east-1'
  }
});

// both of these stacks will use the stage's account/region:
// `.account` and `.region` will resolve to the concrete values as above
new MyStack(myStage, 'Stack1');
new YourStack(myStage, 'Stack2');

// Define an environment-agnostic stack:
// `.account` and `.region` will resolve to `{ "Ref": "AWS::AccountId" }` and `{ "Ref": "AWS::Region" }` respectively.
// which will only resolve to actual values by CloudFormation during deployment.
new MyStack(app, 'Stack1');
```


##### `permissionsBoundary`<sup>Optional</sup> <a name="permissionsBoundary" id="framework.ApplicationStackProps.property.permissionsBoundary"></a>

```typescript
public readonly permissionsBoundary: PermissionsBoundary;
```

- *Type:* aws-cdk-lib.PermissionsBoundary
- *Default:* no permissions boundary is applied

Options for applying a permissions boundary to all IAM Roles and Users created within this Stage.

---

##### `stackName`<sup>Optional</sup> <a name="stackName" id="framework.ApplicationStackProps.property.stackName"></a>

```typescript
public readonly stackName: string;
```

- *Type:* string
- *Default:* Derived from construct path.

Name to deploy the stack with.

---

##### `synthesizer`<sup>Optional</sup> <a name="synthesizer" id="framework.ApplicationStackProps.property.synthesizer"></a>

```typescript
public readonly synthesizer: IStackSynthesizer;
```

- *Type:* aws-cdk-lib.IStackSynthesizer
- *Default:* The synthesizer specified on `App`, or `DefaultStackSynthesizer` otherwise.

Synthesis method to use while deploying this stack.

The Stack Synthesizer controls aspects of synthesis and deployment,
like how assets are referenced and what IAM roles to use. For more
information, see the README of the main CDK package.

If not specified, the `defaultStackSynthesizer` from `App` will be used.
If that is not specified, `DefaultStackSynthesizer` is used if
`@aws-cdk/core:newStyleStackSynthesis` is set to `true` or the CDK major
version is v2. In CDK v1 `LegacyStackSynthesizer` is the default if no
other synthesizer is specified.

---

##### `tags`<sup>Optional</sup> <a name="tags" id="framework.ApplicationStackProps.property.tags"></a>

```typescript
public readonly tags: {[ key: string ]: string};
```

- *Type:* {[ key: string ]: string}
- *Default:* {}

Stack tags that will be applied to all the taggable resources and the stack itself.

---

##### `terminationProtection`<sup>Optional</sup> <a name="terminationProtection" id="framework.ApplicationStackProps.property.terminationProtection"></a>

```typescript
public readonly terminationProtection: boolean;
```

- *Type:* boolean
- *Default:* false

Whether to enable termination protection for this stack.

---

##### `stage`<sup>Optional</sup> <a name="stage" id="framework.ApplicationStackProps.property.stage"></a>

```typescript
public readonly stage: CICDStage;
```

- *Type:* <a href="#framework.CICDStage">CICDStage</a>
- *Default:* No stage is used and the stack is not adapted to the stage

The stage of the CICD pipeline used to change the behavior of the stack.

---

### DataCatalogDatabaseProps <a name="DataCatalogDatabaseProps" id="framework.DataCatalogDatabaseProps"></a>

The Database catalog properties.

#### Initializer <a name="Initializer" id="framework.DataCatalogDatabaseProps.Initializer"></a>

```typescript
import { DataCatalogDatabaseProps } from 'framework'

const dataCatalogDatabaseProps: DataCatalogDatabaseProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#framework.DataCatalogDatabaseProps.property.locationBucket">locationBucket</a></code> | <code>aws-cdk-lib.aws_s3.IBucket</code> | S3 bucket where data is stored. |
| <code><a href="#framework.DataCatalogDatabaseProps.property.locationPrefix">locationPrefix</a></code> | <code>string</code> | Top level location wwhere table data is stored. |
| <code><a href="#framework.DataCatalogDatabaseProps.property.name">name</a></code> | <code>string</code> | Database name. |
| <code><a href="#framework.DataCatalogDatabaseProps.property.autoCrawl">autoCrawl</a></code> | <code>boolean</code> | When enabled, this automatically creates a top level Glue Crawler that would run based on the defined schedule in the `autoCrawlSchedule` parameter. |
| <code><a href="#framework.DataCatalogDatabaseProps.property.autoCrawlSchedule">autoCrawlSchedule</a></code> | <code>aws-cdk-lib.aws_glue.CfnCrawler.ScheduleProperty</code> | The schedule when the Crawler would run. |
| <code><a href="#framework.DataCatalogDatabaseProps.property.crawlerLogEncryptionKey">crawlerLogEncryptionKey</a></code> | <code>aws-cdk-lib.aws_kms.Key</code> | Encryption key used for Crawler logs. |

---

##### `locationBucket`<sup>Required</sup> <a name="locationBucket" id="framework.DataCatalogDatabaseProps.property.locationBucket"></a>

```typescript
public readonly locationBucket: IBucket;
```

- *Type:* aws-cdk-lib.aws_s3.IBucket

S3 bucket where data is stored.

---

##### `locationPrefix`<sup>Required</sup> <a name="locationPrefix" id="framework.DataCatalogDatabaseProps.property.locationPrefix"></a>

```typescript
public readonly locationPrefix: string;
```

- *Type:* string

Top level location wwhere table data is stored.

---

##### `name`<sup>Required</sup> <a name="name" id="framework.DataCatalogDatabaseProps.property.name"></a>

```typescript
public readonly name: string;
```

- *Type:* string

Database name.

Construct would add a randomize suffix as part of the name to prevent name collisions.

---

##### `autoCrawl`<sup>Optional</sup> <a name="autoCrawl" id="framework.DataCatalogDatabaseProps.property.autoCrawl"></a>

```typescript
public readonly autoCrawl: boolean;
```

- *Type:* boolean
- *Default:* True

When enabled, this automatically creates a top level Glue Crawler that would run based on the defined schedule in the `autoCrawlSchedule` parameter.

---

##### `autoCrawlSchedule`<sup>Optional</sup> <a name="autoCrawlSchedule" id="framework.DataCatalogDatabaseProps.property.autoCrawlSchedule"></a>

```typescript
public readonly autoCrawlSchedule: ScheduleProperty;
```

- *Type:* aws-cdk-lib.aws_glue.CfnCrawler.ScheduleProperty
- *Default:* `cron(1 0 * * * *)`

The schedule when the Crawler would run.

Default is once a day at 00:01h.
 
---

##### `crawlerLogEncryptionKey`<sup>Optional</sup> <a name="crawlerLogEncryptionKey" id="framework.DataCatalogDatabaseProps.property.crawlerLogEncryptionKey"></a>

```typescript
public readonly crawlerLogEncryptionKey: Key;
```

- *Type:* aws-cdk-lib.aws_kms.Key
- *Default:* Create a new key if none is provided

Encryption key used for Crawler logs.

---

### DataLakeStorageProps <a name="DataLakeStorageProps" id="framework.DataLakeStorageProps"></a>

Properties for the DataLakeStorage Construct.

#### Initializer <a name="Initializer" id="framework.DataLakeStorageProps.Initializer"></a>

```typescript
import { DataLakeStorageProps } from 'framework'

const dataLakeStorageProps: DataLakeStorageProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#framework.DataLakeStorageProps.property.bronzeBucketArchiveDelay">bronzeBucketArchiveDelay</a></code> | <code>number</code> | Delay (in days) before archiving BRONZE data to frozen storage (Glacier storage class). |
| <code><a href="#framework.DataLakeStorageProps.property.bronzeBucketInfrequentAccessDelay">bronzeBucketInfrequentAccessDelay</a></code> | <code>number</code> | Delay (in days) before moving BRONZE data to cold storage (Infrequent Access storage class). |
| <code><a href="#framework.DataLakeStorageProps.property.bronzeBucketName">bronzeBucketName</a></code> | <code>string</code> | Name of the Bronze bucket. |
| <code><a href="#framework.DataLakeStorageProps.property.dataLakeKey">dataLakeKey</a></code> | <code>aws-cdk-lib.aws_kms.Key</code> | The KMS Key used to encrypt all DataLakeStorage S3 buckets. |
| <code><a href="#framework.DataLakeStorageProps.property.goldBucketArchiveDelay">goldBucketArchiveDelay</a></code> | <code>number</code> | Delay (in days) before archiving GOLD data to frozen storage (Glacier storage class). |
| <code><a href="#framework.DataLakeStorageProps.property.goldBucketInfrequentAccessDelay">goldBucketInfrequentAccessDelay</a></code> | <code>number</code> | Delay (in days) before moving GOLD data to cold storage (Infrequent Access storage class). |
| <code><a href="#framework.DataLakeStorageProps.property.goldBucketName">goldBucketName</a></code> | <code>string</code> | Name of the Gold bucket. |
| <code><a href="#framework.DataLakeStorageProps.property.removalPolicy">removalPolicy</a></code> | <code>aws-cdk-lib.RemovalPolicy</code> | The removal policy when deleting the CDK resource. |
| <code><a href="#framework.DataLakeStorageProps.property.silverBucketArchiveDelay">silverBucketArchiveDelay</a></code> | <code>number</code> | Delay (in days) before archiving SILVER data to frozen storage (Glacier storage class). |
| <code><a href="#framework.DataLakeStorageProps.property.silverBucketInfrequentAccessDelay">silverBucketInfrequentAccessDelay</a></code> | <code>number</code> | Delay (in days) before moving SILVER data to cold storage (Infrequent Access storage class). |
| <code><a href="#framework.DataLakeStorageProps.property.silverBucketName">silverBucketName</a></code> | <code>string</code> | Name of the Silver bucket. |

---

##### `bronzeBucketArchiveDelay`<sup>Optional</sup> <a name="bronzeBucketArchiveDelay" id="framework.DataLakeStorageProps.property.bronzeBucketArchiveDelay"></a>

```typescript
public readonly bronzeBucketArchiveDelay: number;
```

- *Type:* number
- *Default:* Move objects to Glacier after 90 days.

Delay (in days) before archiving BRONZE data to frozen storage (Glacier storage class).

---

##### `bronzeBucketInfrequentAccessDelay`<sup>Optional</sup> <a name="bronzeBucketInfrequentAccessDelay" id="framework.DataLakeStorageProps.property.bronzeBucketInfrequentAccessDelay"></a>

```typescript
public readonly bronzeBucketInfrequentAccessDelay: number;
```

- *Type:* number
- *Default:* Move objects to Infrequent Access after 30 days.

Delay (in days) before moving BRONZE data to cold storage (Infrequent Access storage class).

---

##### `bronzeBucketName`<sup>Optional</sup> <a name="bronzeBucketName" id="framework.DataLakeStorageProps.property.bronzeBucketName"></a>

```typescript
public readonly bronzeBucketName: string;
```

- *Type:* string
- *Default:* `bronze` will be used.

Name of the Bronze bucket.

Will be appended by the unique ID.

---

##### `dataLakeKey`<sup>Optional</sup> <a name="dataLakeKey" id="framework.DataLakeStorageProps.property.dataLakeKey"></a>

```typescript
public readonly dataLakeKey: Key;
```

- *Type:* aws-cdk-lib.aws_kms.Key
- *Default:* A single KMS customer key is created.

The KMS Key used to encrypt all DataLakeStorage S3 buckets.

---

##### `goldBucketArchiveDelay`<sup>Optional</sup> <a name="goldBucketArchiveDelay" id="framework.DataLakeStorageProps.property.goldBucketArchiveDelay"></a>

```typescript
public readonly goldBucketArchiveDelay: number;
```

- *Type:* number
- *Default:* Objects are not archived to Glacier.

Delay (in days) before archiving GOLD data to frozen storage (Glacier storage class).

---

##### `goldBucketInfrequentAccessDelay`<sup>Optional</sup> <a name="goldBucketInfrequentAccessDelay" id="framework.DataLakeStorageProps.property.goldBucketInfrequentAccessDelay"></a>

```typescript
public readonly goldBucketInfrequentAccessDelay: number;
```

- *Type:* number
- *Default:* Move objects to Infrequent Access after 90 days.

Delay (in days) before moving GOLD data to cold storage (Infrequent Access storage class).

---

##### `goldBucketName`<sup>Optional</sup> <a name="goldBucketName" id="framework.DataLakeStorageProps.property.goldBucketName"></a>

```typescript
public readonly goldBucketName: string;
```

- *Type:* string
- *Default:* `gold` will be used.

Name of the Gold bucket.

Will be appended by the unique ID.

---

##### `removalPolicy`<sup>Optional</sup> <a name="removalPolicy" id="framework.DataLakeStorageProps.property.removalPolicy"></a>

```typescript
public readonly removalPolicy: RemovalPolicy;
```

- *Type:* aws-cdk-lib.RemovalPolicy
- *Default:* The resources are not deleted (`RemovalPolicy.RETAIN`).

The removal policy when deleting the CDK resource.

If DESTROY is selected, context value `@aws-data-solutions-framework/removeDataOnDestroy` needs to be set to true.
Otherwise the removalPolicy is reverted to RETAIN.

---

##### `silverBucketArchiveDelay`<sup>Optional</sup> <a name="silverBucketArchiveDelay" id="framework.DataLakeStorageProps.property.silverBucketArchiveDelay"></a>

```typescript
public readonly silverBucketArchiveDelay: number;
```

- *Type:* number
- *Default:* Objects are not archived to Glacier.

Delay (in days) before archiving SILVER data to frozen storage (Glacier storage class).

---

##### `silverBucketInfrequentAccessDelay`<sup>Optional</sup> <a name="silverBucketInfrequentAccessDelay" id="framework.DataLakeStorageProps.property.silverBucketInfrequentAccessDelay"></a>

```typescript
public readonly silverBucketInfrequentAccessDelay: number;
```

- *Type:* number
- *Default:* Move objects to Infrequent Access after 90 days.

Delay (in days) before moving SILVER data to cold storage (Infrequent Access storage class).

---

##### `silverBucketName`<sup>Optional</sup> <a name="silverBucketName" id="framework.DataLakeStorageProps.property.silverBucketName"></a>

```typescript
public readonly silverBucketName: string;
```

- *Type:* string
- *Default:* `silver` will be used.

Name of the Silver bucket.

Will be appended by the unique ID.

---

### SparkCICDPipelineProps <a name="SparkCICDPipelineProps" id="framework.SparkCICDPipelineProps"></a>

Properties for SparkCICDPipeline class.

#### Initializer <a name="Initializer" id="framework.SparkCICDPipelineProps.Initializer"></a>

```typescript
import { SparkCICDPipelineProps } from 'framework'

const sparkCICDPipelineProps: SparkCICDPipelineProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#framework.SparkCICDPipelineProps.property.applicationName">applicationName</a></code> | <code>string</code> | The name of the Spark application to be deployed. |
| <code><a href="#framework.SparkCICDPipelineProps.property.applicationStackFactory">applicationStackFactory</a></code> | <code><a href="#framework.ApplicationStackFactory">ApplicationStackFactory</a></code> | The application Stack to deploy in the different CDK Pipelines Stages. |
| <code><a href="#framework.SparkCICDPipelineProps.property.cdkApplicationPath">cdkApplicationPath</a></code> | <code>string</code> | The path to the folder that contains the CDK Application. |
| <code><a href="#framework.SparkCICDPipelineProps.property.integTestEnv">integTestEnv</a></code> | <code>{[ key: string ]: string}</code> | The environment variables to create from the Application Stack and to pass to the integration tests. |
| <code><a href="#framework.SparkCICDPipelineProps.property.integTestPermissions">integTestPermissions</a></code> | <code>aws-cdk-lib.aws_iam.PolicyStatement[]</code> | The IAM policy statements to add permissions for running the integration tests. |
| <code><a href="#framework.SparkCICDPipelineProps.property.integTestScript">integTestScript</a></code> | <code>string</code> | The path to the Shell script that contains integration tests. |
| <code><a href="#framework.SparkCICDPipelineProps.property.sparkApplicationPath">sparkApplicationPath</a></code> | <code>string</code> | The path to the folder that contains the Spark Application. |
| <code><a href="#framework.SparkCICDPipelineProps.property.sparkImage">sparkImage</a></code> | <code><a href="#framework.SparkImage">SparkImage</a></code> | The EMR Spark image to use to run the unit tests. |

---

##### `applicationName`<sup>Required</sup> <a name="applicationName" id="framework.SparkCICDPipelineProps.property.applicationName"></a>

```typescript
public readonly applicationName: string;
```

- *Type:* string

The name of the Spark application to be deployed.

---

##### `applicationStackFactory`<sup>Required</sup> <a name="applicationStackFactory" id="framework.SparkCICDPipelineProps.property.applicationStackFactory"></a>

```typescript
public readonly applicationStackFactory: ApplicationStackFactory;
```

- *Type:* <a href="#framework.ApplicationStackFactory">ApplicationStackFactory</a>

The application Stack to deploy in the different CDK Pipelines Stages.

---

##### `cdkApplicationPath`<sup>Optional</sup> <a name="cdkApplicationPath" id="framework.SparkCICDPipelineProps.property.cdkApplicationPath"></a>

```typescript
public readonly cdkApplicationPath: string;
```

- *Type:* string
- *Default:* The root of the repository

The path to the folder that contains the CDK Application.

---

##### `dockerImage`<sup>Optional</sup> <a name="dockerImage" id="framework.SparkCICDPipelineProps.property.dockerImage"></a>

```typescript
public readonly dockerImage: string;
```

- *Type:* string
- *Default:* The latest EMR docker image

The Docker image to use in the unit tests.

---

##### `integTestEnv`<sup>Optional</sup> <a name="integTestEnv" id="framework.SparkCICDPipelineProps.property.integTestEnv"></a>

```typescript
public readonly integTestEnv: {[ key: string ]: string};
```

- *Type:* {[ key: string ]: string}
- *Default:* No environment variables

The environment variables to create from the Application Stack and to pass to the integration tests.

This is used to interact with resources created by the Application Stack from within the integration tests script.
Key is the name of the environment variable to create. Value is generally a CfnOutput name from the Application Stack.

---

##### `integTestPermissions`<sup>Optional</sup> <a name="integTestPermissions" id="framework.SparkCICDPipelineProps.property.integTestPermissions"></a>

```typescript
public readonly integTestPermissions: PolicyStatement[];
```

- *Type:* aws-cdk-lib.aws_iam.PolicyStatement[]
- *Default:* No permissions

The IAM policy statements to add permissions for running the integration tests.

---

##### `integTestScript`<sup>Optional</sup> <a name="integTestScript" id="framework.SparkCICDPipelineProps.property.integTestScript"></a>

```typescript
public readonly integTestScript: string;
```

- *Type:* string
- *Default:* No integration tests are run

The path to the Shell script that contains integration tests.

---

##### `sparkApplicationPath`<sup>Optional</sup> <a name="sparkApplicationPath" id="framework.SparkCICDPipelineProps.property.sparkApplicationPath"></a>

```typescript
public readonly sparkApplicationPath: string;
```

- *Type:* string
- *Default:* The root of the repository

The path to the folder that contains the Spark Application.

---

##### `sparkImage`<sup>Optional</sup> <a name="sparkImage" id="framework.SparkCICDPipelineProps.property.sparkImage"></a>

```typescript
public readonly sparkImage: SparkImage;
```

- *Type:* <a href="#framework.SparkImage">SparkImage</a>
- *Default:* EMR v6.12 is used

The EMR Spark image to use to run the unit tests.

---

### SparkRuntimeServerlessProps <a name="SparkRuntimeServerlessProps" id="framework.SparkRuntimeServerlessProps"></a>

Properties for the {SparkRuntimeServerless} construct.

#### Initializer <a name="Initializer" id="framework.SparkRuntimeServerlessProps.Initializer"></a>

```typescript
import { SparkRuntimeServerlessProps } from 'framework'

const sparkRuntimeServerlessProps: SparkRuntimeServerlessProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#framework.SparkRuntimeServerlessProps.property.name">name</a></code> | <code>string</code> | The name of the application. The name must be less than 64 characters. |
| <code><a href="#framework.SparkRuntimeServerlessProps.property.releaseLabel">releaseLabel</a></code> | <code><a href="#framework.EmrVersion">EmrVersion</a></code> | The EMR release version associated with the application. |
| <code><a href="#framework.SparkRuntimeServerlessProps.property.architecture">architecture</a></code> | <code><a href="#framework.Architecture">Architecture</a></code> | The CPU architecture type of the application. |
| <code><a href="#framework.SparkRuntimeServerlessProps.property.autoStartConfiguration">autoStartConfiguration</a></code> | <code>aws-cdk-lib.IResolvable \| aws-cdk-lib.aws_emrserverless.CfnApplication.AutoStartConfigurationProperty</code> | The configuration for an application to automatically start on job submission. |
| <code><a href="#framework.SparkRuntimeServerlessProps.property.autoStopConfiguration">autoStopConfiguration</a></code> | <code>aws-cdk-lib.IResolvable \| aws-cdk-lib.aws_emrserverless.CfnApplication.AutoStopConfigurationProperty</code> | The configuration for an application to automatically stop after a certain amount of time being idle. |
| <code><a href="#framework.SparkRuntimeServerlessProps.property.imageConfiguration">imageConfiguration</a></code> | <code>aws-cdk-lib.IResolvable \| aws-cdk-lib.aws_emrserverless.CfnApplication.ImageConfigurationInputProperty</code> | The image configuration. |
| <code><a href="#framework.SparkRuntimeServerlessProps.property.initialCapacity">initialCapacity</a></code> | <code>aws-cdk-lib.IResolvable \| aws-cdk-lib.IResolvable \| aws-cdk-lib.aws_emrserverless.CfnApplication.InitialCapacityConfigKeyValuePairProperty[]</code> | The initial capacity of the application. |
| <code><a href="#framework.SparkRuntimeServerlessProps.property.maximumCapacity">maximumCapacity</a></code> | <code>aws-cdk-lib.IResolvable \| aws-cdk-lib.aws_emrserverless.CfnApplication.MaximumAllowedResourcesProperty</code> | The maximum capacity of the application. |
| <code><a href="#framework.SparkRuntimeServerlessProps.property.networkConfiguration">networkConfiguration</a></code> | <code>aws-cdk-lib.IResolvable \| aws-cdk-lib.aws_emrserverless.CfnApplication.NetworkConfigurationProperty</code> | The network configuration for customer VPC connectivity for the application. |
| <code><a href="#framework.SparkRuntimeServerlessProps.property.workerTypeSpecifications">workerTypeSpecifications</a></code> | <code>aws-cdk-lib.IResolvable \| {[ key: string ]: aws-cdk-lib.IResolvable \| aws-cdk-lib.aws_emrserverless.CfnApplication.WorkerTypeSpecificationInputProperty}</code> | The container image to use in the application. |

---

##### `name`<sup>Required</sup> <a name="name" id="framework.SparkRuntimeServerlessProps.property.name"></a>

```typescript
public readonly name: string;
```

- *Type:* string

The name of the application. The name must be less than 64 characters.

*Pattern* : `^[A-Za-z0-9._\\/#-]+$`

---

##### `releaseLabel`<sup>Required</sup> <a name="releaseLabel" id="framework.SparkRuntimeServerlessProps.property.releaseLabel"></a>

```typescript
public readonly releaseLabel: EmrVersion;
```

- *Type:* <a href="#framework.EmrVersion">EmrVersion</a>

The EMR release version associated with the application.

The EMR release can be found in this [documentation](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-release-6x.html)

---

##### `architecture`<sup>Optional</sup> <a name="architecture" id="framework.SparkRuntimeServerlessProps.property.architecture"></a>

```typescript
public readonly architecture: Architecture;
```

- *Type:* <a href="#framework.Architecture">Architecture</a>

The CPU architecture type of the application.

---

##### `autoStartConfiguration`<sup>Optional</sup> <a name="autoStartConfiguration" id="framework.SparkRuntimeServerlessProps.property.autoStartConfiguration"></a>

```typescript
public readonly autoStartConfiguration: IResolvable | AutoStartConfigurationProperty;
```

- *Type:* aws-cdk-lib.IResolvable | aws-cdk-lib.aws_emrserverless.CfnApplication.AutoStartConfigurationProperty

The configuration for an application to automatically start on job submission.

---

##### `autoStopConfiguration`<sup>Optional</sup> <a name="autoStopConfiguration" id="framework.SparkRuntimeServerlessProps.property.autoStopConfiguration"></a>

```typescript
public readonly autoStopConfiguration: IResolvable | AutoStopConfigurationProperty;
```

- *Type:* aws-cdk-lib.IResolvable | aws-cdk-lib.aws_emrserverless.CfnApplication.AutoStopConfigurationProperty

The configuration for an application to automatically stop after a certain amount of time being idle.

---

##### `imageConfiguration`<sup>Optional</sup> <a name="imageConfiguration" id="framework.SparkRuntimeServerlessProps.property.imageConfiguration"></a>

```typescript
public readonly imageConfiguration: IResolvable | ImageConfigurationInputProperty;
```

- *Type:* aws-cdk-lib.IResolvable | aws-cdk-lib.aws_emrserverless.CfnApplication.ImageConfigurationInputProperty

The image configuration.

---

##### `initialCapacity`<sup>Optional</sup> <a name="initialCapacity" id="framework.SparkRuntimeServerlessProps.property.initialCapacity"></a>

```typescript
public readonly initialCapacity: IResolvable | IResolvable | InitialCapacityConfigKeyValuePairProperty[];
```

- *Type:* aws-cdk-lib.IResolvable | aws-cdk-lib.IResolvable | aws-cdk-lib.aws_emrserverless.CfnApplication.InitialCapacityConfigKeyValuePairProperty[]

The initial capacity of the application.

---

##### `maximumCapacity`<sup>Optional</sup> <a name="maximumCapacity" id="framework.SparkRuntimeServerlessProps.property.maximumCapacity"></a>

```typescript
public readonly maximumCapacity: IResolvable | MaximumAllowedResourcesProperty;
```

- *Type:* aws-cdk-lib.IResolvable | aws-cdk-lib.aws_emrserverless.CfnApplication.MaximumAllowedResourcesProperty

The maximum capacity of the application.

This is cumulative across all workers at any given point in time during the lifespan of the application is created. No new resources will be created once any one of the defined limits is hit.

---

##### `networkConfiguration`<sup>Optional</sup> <a name="networkConfiguration" id="framework.SparkRuntimeServerlessProps.property.networkConfiguration"></a>

```typescript
public readonly networkConfiguration: IResolvable | NetworkConfigurationProperty;
```

- *Type:* aws-cdk-lib.IResolvable | aws-cdk-lib.aws_emrserverless.CfnApplication.NetworkConfigurationProperty

The network configuration for customer VPC connectivity for the application.

---

##### `workerTypeSpecifications`<sup>Optional</sup> <a name="workerTypeSpecifications" id="framework.SparkRuntimeServerlessProps.property.workerTypeSpecifications"></a>

```typescript
public readonly workerTypeSpecifications: IResolvable | {[ key: string ]: IResolvable | WorkerTypeSpecificationInputProperty};
```

- *Type:* aws-cdk-lib.IResolvable | {[ key: string ]: aws-cdk-lib.IResolvable | aws-cdk-lib.aws_emrserverless.CfnApplication.WorkerTypeSpecificationInputProperty}

The container image to use in the application.

If none is provided the application will use the base Amazon EMR Serverless image for the specified EMR release.
This is an [example](https://docs.aws.amazon.com/emr/latest/EMR-Serverless-UserGuide/application-custom-image.html) of usage

---

## Classes <a name="Classes" id="Classes"></a>

### ApplicationStackFactory <a name="ApplicationStackFactory" id="framework.ApplicationStackFactory"></a>

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


#### Initializers <a name="Initializers" id="framework.ApplicationStackFactory.Initializer"></a>

```typescript
import { ApplicationStackFactory } from 'framework'

new ApplicationStackFactory()
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#framework.ApplicationStackFactory.createStack">createStack</a></code> | Abstract method that needs to be implemented to return the application Stack. |

---

##### `createStack` <a name="createStack" id="framework.ApplicationStackFactory.createStack"></a>

```typescript
public createStack(scope: Construct, id: string, stage?: CICDStage): ApplicationStack
```

Abstract method that needs to be implemented to return the application Stack.

###### `scope`<sup>Required</sup> <a name="scope" id="framework.ApplicationStackFactory.createStack.parameter.scope"></a>

- *Type:* constructs.Construct

The scope to create the stack in.

---

###### `id`<sup>Required</sup> <a name="id" id="framework.ApplicationStackFactory.createStack.parameter.id"></a>

- *Type:* string

---

###### `stage`<sup>Optional</sup> <a name="stage" id="framework.ApplicationStackFactory.createStack.parameter.stage"></a>

- *Type:* <a href="#framework.CICDStage">CICDStage</a>

The stage of the pipeline.

---





## Enums <a name="Enums" id="Enums"></a>

### Architecture <a name="Architecture" id="framework.Architecture"></a>

Enum defining the CPU architecture type of the application, either  X86_64 or ARM64.

#### Members <a name="Members" id="Members"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#framework.Architecture.X86_64">X86_64</a></code> | *No description.* |
| <code><a href="#framework.Architecture.ARM64">ARM64</a></code> | *No description.* |

---

##### `X86_64` <a name="X86_64" id="framework.Architecture.X86_64"></a>

---


##### `ARM64` <a name="ARM64" id="framework.Architecture.ARM64"></a>

---


### CICDStage <a name="CICDStage" id="framework.CICDStage"></a>

The list of CICD Stages to deploy the SparkCICDStack.

#### Members <a name="Members" id="Members"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#framework.CICDStage.STAGING">STAGING</a></code> | *No description.* |
| <code><a href="#framework.CICDStage.PROD">PROD</a></code> | *No description.* |

---

##### `STAGING` <a name="STAGING" id="framework.CICDStage.STAGING"></a>

---


##### `PROD` <a name="PROD" id="framework.CICDStage.PROD"></a>

---


### EmrVersion <a name="EmrVersion" id="framework.EmrVersion"></a>

Enum defining the EMR version as defined [here](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-release-6x.html).

#### Members <a name="Members" id="Members"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#framework.EmrVersion.V6_12">V6_12</a></code> | *No description.* |
| <code><a href="#framework.EmrVersion.V6_11_1">V6_11_1</a></code> | *No description.* |
| <code><a href="#framework.EmrVersion.V6_11">V6_11</a></code> | *No description.* |
| <code><a href="#framework.EmrVersion.V6_10_1">V6_10_1</a></code> | *No description.* |
| <code><a href="#framework.EmrVersion.V6_10">V6_10</a></code> | *No description.* |
| <code><a href="#framework.EmrVersion.V6_9">V6_9</a></code> | *No description.* |
| <code><a href="#framework.EmrVersion.V6_8">V6_8</a></code> | *No description.* |
| <code><a href="#framework.EmrVersion.V6_7">V6_7</a></code> | *No description.* |
| <code><a href="#framework.EmrVersion.V6_6">V6_6</a></code> | *No description.* |
| <code><a href="#framework.EmrVersion.V6_5">V6_5</a></code> | *No description.* |
| <code><a href="#framework.EmrVersion.V6_4">V6_4</a></code> | *No description.* |
| <code><a href="#framework.EmrVersion.V6_3">V6_3</a></code> | *No description.* |
| <code><a href="#framework.EmrVersion.V6_2">V6_2</a></code> | *No description.* |
| <code><a href="#framework.EmrVersion.V5_33">V5_33</a></code> | *No description.* |
| <code><a href="#framework.EmrVersion.V5_32">V5_32</a></code> | *No description.* |

---

##### `V6_12` <a name="V6_12" id="framework.EmrVersion.V6_12"></a>

---


##### `V6_11_1` <a name="V6_11_1" id="framework.EmrVersion.V6_11_1"></a>

---


##### `V6_11` <a name="V6_11" id="framework.EmrVersion.V6_11"></a>

---


##### `V6_10_1` <a name="V6_10_1" id="framework.EmrVersion.V6_10_1"></a>

---


##### `V6_10` <a name="V6_10" id="framework.EmrVersion.V6_10"></a>

---


##### `V6_9` <a name="V6_9" id="framework.EmrVersion.V6_9"></a>

---


##### `V6_8` <a name="V6_8" id="framework.EmrVersion.V6_8"></a>

---


##### `V6_7` <a name="V6_7" id="framework.EmrVersion.V6_7"></a>

---


##### `V6_6` <a name="V6_6" id="framework.EmrVersion.V6_6"></a>

---


##### `V6_5` <a name="V6_5" id="framework.EmrVersion.V6_5"></a>

---


##### `V6_4` <a name="V6_4" id="framework.EmrVersion.V6_4"></a>

---


##### `V6_3` <a name="V6_3" id="framework.EmrVersion.V6_3"></a>

---


##### `V6_2` <a name="V6_2" id="framework.EmrVersion.V6_2"></a>

---


##### `V5_33` <a name="V5_33" id="framework.EmrVersion.V5_33"></a>

---


##### `V5_32` <a name="V5_32" id="framework.EmrVersion.V5_32"></a>

---


### SparkImage <a name="SparkImage" id="framework.SparkImage"></a>

The list of supported Spark images to use in the SparkCICDPipeline.

#### Members <a name="Members" id="Members"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#framework.SparkImage.EMR_6_12">EMR_6_12</a></code> | *No description.* |
| <code><a href="#framework.SparkImage.EMR_6_11">EMR_6_11</a></code> | *No description.* |
| <code><a href="#framework.SparkImage.EMR_6_10">EMR_6_10</a></code> | *No description.* |
| <code><a href="#framework.SparkImage.EMR_6_9">EMR_6_9</a></code> | *No description.* |

---

##### `EMR_6_12` <a name="EMR_6_12" id="framework.SparkImage.EMR_6_12"></a>

---


##### `EMR_6_11` <a name="EMR_6_11" id="framework.SparkImage.EMR_6_11"></a>

---


##### `EMR_6_10` <a name="EMR_6_10" id="framework.SparkImage.EMR_6_10"></a>

---


##### `EMR_6_9` <a name="EMR_6_9" id="framework.SparkImage.EMR_6_9"></a>

---

