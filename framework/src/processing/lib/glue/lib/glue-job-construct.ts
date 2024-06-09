import { Construct } from 'constructs';
import { aws_glue as glue_alpha, aws_iam as iam, aws_s3 as s3, RemovalPolicy} from 'aws-cdk-lib';

interface GlueJobConstructProps {
  role: iam.Role;
  dependencyBucket: s3.Bucket;
  pythonDependenciesPath: string;
  jarsPath: string;
  scriptPath: string;
}

export class GlueJobConstruct extends Construct {
  constructor(scope: Construct, id: string, props: GlueJobConstructProps) {
    super(scope, id);

        // Create an IAM role for the Glue job
    const glueJobRole = new iam.Role(this, 'GlueJobRole', {
      assumedBy: new iam.ServicePrincipal('glue.amazonaws.com'),
    });

    // Attach necessary policies to the role
    glueJobRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSGlueServiceRole'));
    glueJobRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'));
    glueJobRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'));

    new glue_alpha.CfnJob(this, 'GlueWordCountJob', {
      name: 'GlueWordCountJob',
      role: glueJobRole.roleArn,
      command: {
        name: 'glueetl',
        scriptLocation: `s3://${props.dependencyBucket}/scripts/word_count.py`,
        pythonVersion: '3',
      },
      glueVersion: '4.0',
      description: 'A job to run a word count program',
      defaultArguments: {
        '--TempDir': `s3://${props.dependencyBucket}/temp/`,
        '--job-language': 'python',
        '--extra-py-files': '', // Placeholder for extra py files
        '--input_path': '', // Placeholder for input path
        '--output_path': '', // Placeholder for output path
      },
      maxRetries: 0,
      maxCapacity: 10.0, // This is the equivalent of setting numberOfWorkers and workerType
      executionProperty: {
        maxConcurrentRuns: 1,
      },
    });
  }
}
