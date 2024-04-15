[//]: # (streaming.kafka-api)
# Kafka Api - Bring your own cluster

Standalone access to Kafka data plane API to perform Create/Update/Delete operations for ACLs and Topics. The constructs support both MSK Serverless and MSK Provisioned, and is used when you need to bring your own cluster.

## Overview

The construct leverages the [CDK Provider Framework](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.custom_resources-readme.html#provider-framework) to deploy a custom resource to manage `topics`, and in case of `mTLS` authentication deploys also a custom resource to manage `ACLs`.

[example kafka api](./examples/kafka-api-default.lit.ts)

:::warning

THe construct needs to be deployed in the same region as the MSK cluster

:::

## Using mTLS authentication

When using MSK with mTLS the constructs requires a principal that is assigned to the custom resources that manage ACLs and Topics. The certificate and private key are expected to be in a secret managed by [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html). The secret needs to be in the format defined below and stored a `JSON Key/value` and not `Plaintext` in the Secret. The construct grants the lambda that supports the Custom Resource read access to the secret as an `Identity based policy`.

```json
    {
      key : "-----BEGIN RSA PRIVATE KEY----- XXXXXXXXXXXXXXXXX -----END RSA PRIVATE KEY-----",
     
      cert : "-----BEGIN CERTIFICATE----- yyyyyyyyyyyyyyyy -----END CERTIFICATE-----"
    }
```

You can create the secret with the following AWS CLI command:
```bash
aws secretsmanager create-secret --name my-secret \
    --secret-string '{"key": "PRIVATE-KEY", "cert": "CERTIFICATE"}'
```

:::danger

Do not create the secret as part of the CDK application. The secret contains the private key and the deployment is not secured.

:::

You can use this [utility](https://github.com/aws-samples/amazon-msk-client-authentication) to generate the certificates:
1. Build the tool
2. Run the following command to generate the certificates and print them
```bash
java -jar AuthMSK-1.0-SNAPSHOT.jar -caa <PCA_ARN> -ccf tmp/client_cert.pem -pem -pkf tmp/private_key.pem -ksp "XXXXXXXXXX" -ksl tmp/kafka.client.keystore.jks
cat tmp/client_cert.pem
cat tmp/private_key.pem
```
3. Copy/paste the value of the client certificate and the private key in the secret

### setTopic

This method allows you to create, update or delete a topic. Its backend uses [kafkajs](https://kafka.js.org/).
The topic is defined by the property type called `MskTopic`. Below you can see the definition of the ACL as well as a usage. 

```json
{
    topic: <String>,
    numPartitions: <Number>,     // default: -1 (uses broker `num.partitions` configuration)
    replicationFactor: <Number>, // default: -1 (uses broker `default.replication.factor` configuration)
    replicaAssignment: <Array>,  // Example: [{ partition: 0, replicas: [0,1,2] }] - default: []
    configEntries: <Array>       // Example: [{ name: 'cleanup.policy', value: 'compact' }] - default: []
}
```

Dependeding on the authentication type that is set in the cluster, you need to put the right parameter in authentication, for mTLS use `Authentitcation.MTLS` and for IAM use `Authentitcation.IAM`. The example below uses IAM as authentication.

[example msk provisiond setTopic](./examples/kafka-api-set-topic.lit.ts)

### setACL

This method allows you to create, update or delete an ACL. Its backend uses [kafkajs](https://kafka.js.org/).
The topic is defined by the property type called `MskACL`. This method should be used only when the cluster authentication is set to `mTLS`. Below you can see the definition of the topic as well as an example of use.

```json
{
    resourceType: <AclResourceTypes>,
    resourceName: <String>,
    resourcePatternType: <ResourcePatternTypes>,
    principal: <String>,
    host: <String>,
    operation: <AclOperationTypes>,
    permissionType: <AclPermissionTypes>,
}
```

[example msk provisiond setACL](./examples/kafka-api-set-acl.lit.ts)

### grantProduce

This method allows to grant a `Principal` the permissions to write to a kafka topic.
In case of IAM authentication the method attaches an IAM policy as defined in the [AWS documentation](https://docs.aws.amazon.com/msk/latest/developerguide/iam-access-control.html#iam-access-control-use-cases) scoped only to the topic provided. For mTLS authentication, the method applies an ACL for the provided `Common Name` that allow write operations on the topic. 


[example msk provisioned grantProduce](./examples/kafka-api-grant-produce.lit.ts)

### grantConsume

This method allows to grant a `Principal` the permissions to read to a kafka topic.
In case of IAM authentication the method attachs an IAM policy as defined in the [AWS documentation](https://docs.aws.amazon.com/msk/latest/developerguide/iam-access-control.html#iam-access-control-use-cases) scoped only to the topic provided. For mTLS authentication, the method applies an ACL for the provided `Common Name` that allow read operations on the topic.

[example msk provisioned grantConsume](./examples/kafka-api-grant-consume.lit.ts)