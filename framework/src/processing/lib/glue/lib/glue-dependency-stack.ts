import { Construct } from 'constructs';
import { aws_s3 as s3, aws_s3_deployment as s3_deployment} from 'aws-cdk-lib';
import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import * as path from 'path';

interface GlueDependencyStackProps extends StackProps {
  bucket: s3.Bucket;
}

export class GlueDependencyStack extends Stack {

  constructor(scope: Construct, id: string, props: GlueDependencyStackProps) {
    super(scope, id, props);

    // Upload dependencies to S3
    new s3_deployment.BucketDeployment(this, 'DeployExtraPythonFiles', {
      sources: [s3_deployment.Source.asset(path.join(__dirname, '../extra_python'))],
      destinationBucket: props.bucket,
      destinationKeyPrefix: 'extra_python',
    });

    new s3_deployment.BucketDeployment(this, 'DeployExtraJars', {
      sources: [s3_deployment.Source.asset(path.join(__dirname, '../jars'))],
      destinationBucket: props.bucket,
      destinationKeyPrefix: 'jars',
    });

    new s3_deployment.BucketDeployment(this, 'DeployDependencies', {
      sources: [s3_deployment.Source.asset(path.join(__dirname, '../python'))],
      destinationBucket: props.bucket,
      destinationKeyPrefix: 'python',
    });

    new s3_deployment.BucketDeployment(this, 'DeployScript', {
      sources: [s3_deployment.Source.asset(path.join(__dirname, '../scripts'))],
      destinationBucket: props.bucket,
      destinationKeyPrefix: 'scripts',
    });
  }
}
