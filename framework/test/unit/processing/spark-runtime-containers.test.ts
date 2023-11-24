// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


/**
 * Tests Spark runtime EMR Containers construct
 *
 * @group unit/processing-runtime/containers/emr-containers
*/


import { KubectlV27Layer } from '@aws-cdk/lambda-layer-kubectl-v27';
import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { ManagedPolicy, PolicyDocument, PolicyStatement, Role } from 'aws-cdk-lib/aws-iam';
import { SparkEmrContainersRuntime } from '../../../src/processing';
import { Cluster, KubernetesVersion } from 'aws-cdk-lib/aws-eks';

describe('With default configuration, the construct ', () => {

  const emrEksClusterStack = new Stack();

  const kubectlLayer = new KubectlV27Layer(emrEksClusterStack, 'kubectlLayer');

  const adminRole = Role.fromRoleArn(emrEksClusterStack, 'AdminRole', 'arn:aws:iam::123445678901:role/eks-admin');

  const emrEksCluster = SparkEmrContainersRuntime.getOrCreate(emrEksClusterStack, {
    eksAdminRole: adminRole,
    publicAccessCIDRs: ['10.0.0.0/32'],
    kubectlLambdaLayer: kubectlLayer,
  });

  emrEksCluster.addEmrVirtualCluster(emrEksClusterStack, {
    name: 'test',
  });

  const policy = new ManagedPolicy(emrEksClusterStack, 'testPolicy', {
    document: new PolicyDocument({
      statements: [
        new PolicyStatement({
          resources: ['arn:aws:s3:::aws-data-analytics-workshop'],
          actions: ['s3:GetObject'],
        }),
      ],
    }),
  });

  emrEksCluster.createExecutionRole(emrEksClusterStack, 'test', policy, 'nons', 'myExecRole');

  const template = Template.fromStack(emrEksClusterStack);
  // console.log(JSON.stringify(template.toJSON(), null, 2));

  test('should create an EKS cluster with correct version', () => {
    template.hasResourceProperties('Custom::AWSCDK-EKS-Cluster', {
      Config: Match.objectLike({
        version: '1.27',
        name: 'data-platform',
      }),
    });
  });

  test('should create the emr-containers service linked role', () => {
    // THEN
    template.hasResourceProperties('AWS::IAM::ServiceLinkedRole', {
      AWSServiceName: 'emr-containers.amazonaws.com',
    });
  });

  test('should create the AWS node role and update the AWS node service account', () => {
    // THEN
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: Match.objectLike({
        Statement: [
          {
            Action: 'sts:AssumeRoleWithWebIdentity',
            Effect: 'Allow',
            Principal: {
              Federated: {
                Ref: Match.stringLikeRegexp('.*OpenIdConnectProvider.*'),
              },
            },
          },
        ],
      }),
      Description: {
        'Fn::Join': Match.arrayWith([
          [
            'awsNodeRole-',
            {
              Ref: Match.stringLikeRegexp('EksCluster.*'),
            },
          ],
        ]),
      },
      ManagedPolicyArns: [
        {
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([
              ':iam::aws:policy/AmazonEKS_CNI_Policy',
            ]),
          ]),
        },
      ],
    });

    template.hasResourceProperties('Custom::AWSCDK-EKS-KubernetesResource', {
      Manifest: {
        'Fn::Join': Match.arrayWith([
          '',
          Match.arrayWith([
            '[{"apiVersion":"v1","kind":"ServiceAccount","metadata":{"name":"aws-node","namespace":"kube-system","annotations":{"eks.amazonaws.com/role-arn":"',
            {
              'Fn::GetAtt': [
                Match.stringLikeRegexp('DataPlatformAwsNodeRole.*'),
                'Arn',
              ],
            },
          ]),
        ]),
      },
      ClusterName: {
        Ref: Match.stringLikeRegexp('EksCluster.*'),
      },
    });
  });

  test('should create a VPC with correct CIDR and tags', () => {
    // THEN
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      Tags: Match.arrayWith([
        Match.objectLike({
          Key: 'for-use-with-amazon-emr-managed-policies',
          Value: 'true',
        }),
      ]),
    });
  });

  test('should create 2 private subnet with tags', () => {
    // THEN
    template.resourcePropertiesCountIs('AWS::EC2::Subnet', {
      Tags: Match.arrayWith([
        Match.objectLike({
          Key: 'aws-cdk:subnet-type',
          Value: 'Private',
        }),
        Match.objectLike({
          Key: 'for-use-with-amazon-emr-managed-policies',
          Value: 'true',
        }),
      ]),
    }, 2);
  });

  test('should deploy the cert manager', () => {
    template.hasResourceProperties('Custom::AWSCDK-EKS-HelmChart', {
      Chart: 'cert-manager',
      Repository: 'https://charts.jetstack.io',
      Namespace: 'cert-manager',
    });
  });

  test('should deploy the AWS load balancer controller', () => {
    template.hasResourceProperties('Custom::AWSCDK-EKS-HelmChart', {
      Chart: 'aws-load-balancer-controller',
      Repository: 'https://aws.github.io/eks-charts',
      Namespace: 'kube-system',
    });
  });

  test('should deploy the EBS CSI controller', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyName: Match.stringLikeRegexp('.*EbsCsiDriverPolicy.*'),
      Roles: [
        {
          Ref: Match.stringLikeRegexp('.*EbsCsiDriverSaRole.*'),
        },
      ],
    });

    template.hasResourceProperties('AWS::EKS::Addon', {
      AddonName: 'aws-ebs-csi-driver',
      AddonVersion: 'v1.24.1-eksbuild.1',
      ClusterName: {
        Ref: Match.stringLikeRegexp('EksCluster.*'),
      },
      ResolveConflicts: 'OVERWRITE',
      ServiceAccountRoleArn: {
        'Fn::GetAtt': [
          Match.stringLikeRegexp('.*EbsCsiDriverSaRole.*'),
          'Arn',
        ],
      },
    });
  });

  test('should create the tooling nodegroup', () => {
    template.hasResourceProperties('AWS::EKS::Nodegroup', {
      AmiType: 'BOTTLEROCKET_x86_64',
      InstanceTypes: ['t3.medium'],
      Labels: {
        role: 'tooling',
      },
      ScalingConfig: {
        DesiredSize: 2,
        MaxSize: 2,
        MinSize: 2,
      },
      Tags: Match.objectLike({
        'data-solutions-fwk:owned': 'true',
      }),
    });
  });

  test('should create the awsnode role', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: Match.objectLike({
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
          },
        ],
      }),
      ManagedPolicyArns: [
        {
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([
              ':iam::aws:policy/AmazonEKSWorkerNodePolicy',
            ]),
          ]),
        },
        {
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([
              ':iam::aws:policy/AmazonEC2ContainerRegistryReadOnly',
            ]),
          ]),
        },
        {
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([
              ':iam::aws:policy/AmazonSSMManagedInstanceCore',
            ]),
          ]),
        },
        {
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([
              ':iam::aws:policy/AmazonEKS_CNI_Policy',
            ]),
          ]),
        },
      ],
    });
  });

  test('should create an EMR virtual cluster', () => {
    template.hasResourceProperties('AWS::EMRContainers::VirtualCluster', {
      ContainerProvider: Match.objectLike({
        Type: 'EKS',
        Info: Match.objectLike({
          EksInfo: {
            Namespace: 'default',
          },
        }),
      }),
      Name: 'test',
    });
  });

  test('should create a VPC for the EKS cluster', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
      InstanceTenancy: 'default',
      Tags: Match.arrayWith([
        {
          Key: 'for-use-with-amazon-emr-managed-policies',
          Value: 'true',
        },
        {
          Key: 'karpenter.sh/discovery',
          Value: 'data-platform',
        },
        {
          Key: 'Name',
          Value: 'Default/DsfVpc',
        },
      ]),
    });

    template.resourceCountIs('AWS::EC2::Subnet', 4);
    template.resourceCountIs('AWS::EC2::RouteTable', 4);
    template.resourceCountIs('AWS::EC2::SubnetRouteTableAssociation', 4);
    template.resourceCountIs('AWS::EC2::Route', 4);
    template.resourceCountIs('AWS::EC2::EIP', 2);
    template.resourceCountIs('AWS::EC2::NatGateway', 2);
    template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
    template.resourceCountIs('AWS::EC2::FlowLog', 1);
    template.resourceCountIs('AWS::EC2::VPCEndpoint', 1);
    template.resourceCountIs('AWS::Logs::LogGroup', 1);
    template.resourcePropertiesCountIs('AWS::IAM::Role', {
      AssumeRolePolicyDocument: Match.objectLike({
        Statement: [
          Match.objectLike({
            Principal: {
              Service: 'vpc-flow-logs.amazonaws.com',
            },
          }),
        ],
      }),
    }, 1);
    template.resourcePropertiesCountIs('AWS::IAM::Policy', {
      PolicyName: Match.stringLikeRegexp('FlowLog.*'),
    }, 1);
    template.resourcePropertiesCountIs('AWS::EC2::SecurityGroup', {
      GroupDescription: 'EKS Control Plane Security Group',
    }, 1);
  });

  test('should create an S3 bucket for PodTemplate and attach podtemplate policy to execution role', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'aws:kms',
            },
          },
        ],
      },
      Tags: Match.arrayWith([
        {
          Key: {
            'Fn::Join': Match.arrayWith([
              [
                'aws-cdk:cr-owned:',
                {
                  Ref: Match.stringLikeRegexp('EksCluster.*'),
                },
                Match.stringLikeRegexp('/pod-template:.*'),
              ],
            ]),
          },
          Value: 'true',
        },
      ]),
    });

    template.hasResourceProperties('AWS::IAM::Role', {
      Policies: [
        {
          PolicyDocument: Match.objectLike({
            Statement: [
              {
                Action: 's3:getObject',
                Effect: 'Allow',
                Resource: {
                  'Fn::Join': Match.arrayWith([
                    Match.arrayWith([
                      {
                        Ref: Match.stringLikeRegexp('DataPlatformAssetBucket.*'),
                      },
                      {
                        Ref: Match.stringLikeRegexp('EksCluster.*'),
                      },
                      '/pod-template/*',
                    ]),
                  ]),
                },
              },
            ],
          }),
          PolicyName: 'podTemplateAccess',
        },
      ],
      RoleName: 'myExecRole',
    });
  });

  test('should upload Pod Templates into the pod template bucket', () => {
    template.hasResourceProperties('Custom::CDKBucketDeployment', {
      SourceBucketNames: [
        {
          'Fn::Sub': 'cdk-hnb659fds-assets-${AWS::AccountId}-${AWS::Region}',
        },
      ],
      DestinationBucketName: {
        Ref: Match.stringLikeRegexp('DataPlatformAssetBucket.*'),
      },
      DestinationBucketKeyPrefix: {
        'Fn::Join': Match.arrayWith([
          [
            {
              Ref: 'EksClusterFAB68BDB',
            },
            '/pod-template',
          ],
        ]),
      },
      Prune: true,
    });
  });

  test('should create an instance profile for Karpenter', () => {
    template.hasResourceProperties('AWS::IAM::InstanceProfile', {
      Path: '/',
      Roles: [
        {
          Ref: Match.stringLikeRegexp('.*Ec2InstanceNodeGroupRole.*'),
        },
      ],
    });
  });

  test('should create a KMS key for EKS secrets', () => {
    template.hasResourceProperties('AWS::KMS::Key', {
      Description: 'eks-secrets-key',
      EnableKeyRotation: true,
    });
  });

  test('should create a KMS key for encrypting VPC flow logs', () => {
    template.hasResourceProperties('AWS::KMS::Key', {
      Description: 'log-vpc-key',
      EnableKeyRotation: true,
      KeyPolicy: Match.objectLike({
        Statement: Match.arrayWith([
          {
            Action: [
              'kms:Encrypt*',
              'kms:Decrypt*',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:Describe*',
            ],
            Condition: {
              ArnLike: {
                'kms:EncryptionContext:aws:logs:arn': {
                  'Fn::Join': [
                    '',
                    [
                      'arn:aws:logs:',
                      {
                        Ref: 'AWS::Region',
                      },
                      ':',
                      {
                        Ref: 'AWS::AccountId',
                      },
                      ':*',
                    ],
                  ],
                },
              },
            },
            Effect: 'Allow',
            Principal: {
              Service: {
                'Fn::Join': [
                  '',
                  [
                    'logs.',
                    {
                      Ref: 'AWS::Region',
                    },
                    '.amazonaws.com',
                  ],
                ],
              },
            },
            Resource: '*',
          },
        ]),
      }),
    });
  });

  test('should create the execution role with provided policy, podtemplate polic and IRSA setup', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: Match.objectLike({
        Statement: [
          {
            Action: 'sts:AssumeRoleWithWebIdentity',
            Condition: {
              StringLike: {
                'Fn::GetAtt': [
                  Match.stringLikeRegexp('.*IrsaConditionkey.*'),
                  'Value',
                ],
              },
            },
            Effect: 'Allow',
            Principal: {
              Federated: {
                Ref: Match.stringLikeRegexp('.*OpenIdConnectProvider.*'),
              },
            },
          },
        ],
      }),
      ManagedPolicyArns: [
        {
          Ref: Match.stringLikeRegexp('testPolicy.*'),
        },
      ],
      RoleName: 'myExecRole',
    });
  });

  template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
    PolicyDocument: Match.objectLike({
      Statement: Match.arrayWith([
        Match.objectLike({
          Action: 's3:GetObject',
          Effect: 'Allow',
          Resource: 'arn:aws:s3:::aws-data-analytics-workshop',
        }),
      ]),
    }),
  });

  template.hasResourceProperties('Custom::AWSCDKCfnJson', {
    Value: {
      'Fn::Join': Match.arrayWith([
        Match.arrayWith([
          {
            'Fn::Select': [
              1,
              {
                'Fn::Split': [
                  ':oidc-provider/',
                  {
                    Ref: Match.stringLikeRegexp('.*EksClusterOpenIdConnectProvider.*'),
                  },
                ],
              },
            ],
          },
          ':sub":"system:serviceaccount:nons:emr-containers-sa-*-*-',
          {
            Ref: 'AWS::AccountId',
          },
        ]),
      ]),
    },
  });


  test('should create a queue for managing interruption in Karpenter with proper configuration', () => {
    template.hasResourceProperties('AWS::SQS::Queue', {
      MessageRetentionPeriod: 300,
    });

    template.hasResourceProperties('AWS::Events::Rule', {
      EventPattern: {
        source: [
          'aws.heatlh',
        ],
        detail: [
          'AWS Health Event',
        ],
      },
      State: 'ENABLED',
      Targets: [
        {
          Arn: {
            'Fn::GetAtt': [
              Match.stringLikeRegexp('KarpenterInterruptionQueue.*'),
              'Arn',
            ],
          },
          Id: 'Target0',
        },
      ],
    });

    template.hasResourceProperties('AWS::Events::Rule', {
      EventPattern: {
        source: [
          'aws.ec2',
        ],
        detail: [
          'EC2 Instance State-change Notification',
        ],
      },
      State: 'ENABLED',
      Targets: [
        {
          Arn: {
            'Fn::GetAtt': [
              Match.stringLikeRegexp('KarpenterInterruptionQueue.*'),
              'Arn',
            ],
          },
          Id: 'Target0',
        },
      ],
    });
    template.hasResourceProperties('AWS::SQS::QueuePolicy', {
      PolicyDocument: Match.objectLike({
        Statement: [
          {
            Action: 'sqs:*',
            Condition: {
              Bool: {
                'aws:SecureTransport': 'false',
              },
            },
            Effect: 'Deny',
            Principal: {
              AWS: '*',
            },
            Resource: {
              'Fn::GetAtt': [
                Match.stringLikeRegexp('KarpenterInterruptionQueue.*'),
                'Arn',
              ],
            },
          },
          {
            Action: 'sqs:SendMessage',
            Effect: 'Allow',
            Principal: {
              Service: [
                'sqs.amazonaws.com',
                'events.amazonaws.com',
              ],
            },
          },
          {
            Action: [
              'sqs:SendMessage',
              'sqs:GetQueueAttributes',
              'sqs:GetQueueUrl',
            ],
            Condition: {
              ArnEquals: {
                'aws:SourceArn': {
                  'Fn::GetAtt': [
                    Match.stringLikeRegexp('ScheduledChangeRule.*'),
                    'Arn',
                  ],
                },
              },
            },
            Effect: 'Allow',
            Principal: {
              Service: 'events.amazonaws.com',
            },
            Resource: {
              'Fn::GetAtt': [
                Match.stringLikeRegexp('KarpenterInterruptionQueue.*'),
                'Arn',
              ],
            },
          },
          {
            Action: [
              'sqs:SendMessage',
              'sqs:GetQueueAttributes',
              'sqs:GetQueueUrl',
            ],
            Condition: {
              ArnEquals: {
                'aws:SourceArn': {
                  'Fn::GetAtt': [
                    Match.stringLikeRegexp('InstanceStateChangeRule.*'),
                    'Arn',
                  ],
                },
              },
            },
            Effect: 'Allow',
            Principal: {
              Service: 'events.amazonaws.com',
            },
            Resource: {
              'Fn::GetAtt': [
                Match.stringLikeRegexp('KarpenterInterruptionQueue.*'),
                'Arn',
              ],
            },
          },
        ],
      }),
      Queues: [
        {
          Ref: Match.stringLikeRegexp('KarpenterInterruptionQueue.*'),
        },
      ],
    });
  });

  test('should configure proper security group between karpenter and interruption queue', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'security group for a karpenter instances',
      Tags: Match.arrayWith([
        {
          Key: 'karpenter.sh/discovery',
          Value: 'data-platform',
        },
      ]),
      VpcId: {
        Ref: Match.stringLikeRegexp('DsfVpc.*'),
      },
    });

    template.hasResourceProperties('AWS::EC2::SecurityGroupEgress', {
      CidrIp: '0.0.0.0/0',
      Description: 'Allow all outbound traffic by default',
      GroupId: {
        'Fn::GetAtt': [
          Match.stringLikeRegexp('KarpenterSg'),
          'GroupId',
        ],
      },
      IpProtocol: '-1',
    });

    template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
      Description: 'from KarpenterSg:ALL TRAFFIC',
      GroupId: {
        'Fn::GetAtt': [
          Match.stringLikeRegexp('KarpenterSg.*'),
          'GroupId',
        ],
      },
      IpProtocol: '-1',
      SourceSecurityGroupId: {
        'Fn::GetAtt': [
          Match.stringLikeRegexp('KarpenterSg.*'),
          'GroupId',
        ],
      },
    });

    template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
      Description: 'from EksClusterClusterSecurityGroupD517EF5B:ALL TRAFFIC',
      GroupId: {
        'Fn::GetAtt': [
          Match.stringLikeRegexp('KarpenterSg.*'),
          'GroupId',
        ],
      },
      IpProtocol: '-1',
      SourceSecurityGroupId: {
        'Fn::GetAtt': [
          Match.stringLikeRegexp('EksCluster.*'),
          'ClusterSecurityGroupId',
        ],
      },
    });
  });
});

describe('With DESTROY removal policy and global data removal set to TRUE, the construct ', () => {

  const emrEksClusterStack = new Stack();
  // Set context value for global data removal policy
  emrEksClusterStack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

  const kubectlLayer = new KubectlV27Layer(emrEksClusterStack, 'kubectlLayer');

  const adminRole = Role.fromRoleArn(emrEksClusterStack, 'AdminRole', 'arn:aws:iam::123445678901:role/eks-admin');

  SparkEmrContainersRuntime.getOrCreate(emrEksClusterStack, {
    eksAdminRole: adminRole,
    publicAccessCIDRs: ['10.0.0.0/32'],
    kubectlLambdaLayer: kubectlLayer,
    removalPolicy: RemovalPolicy.DESTROY,
  });

  const template = Template.fromStack(emrEksClusterStack);
  // console.log(JSON.stringify(template.toJSON(), null, 2));

  test('should create a Karpenter queue with DELETE removal policy', () => {
    template.hasResource('AWS::SQS::Queue', {
      UpdateReplacePolicy: 'Delete',
      DeletionPolicy: 'Delete',
    });
  });

  test('should create a pod template Bucket with DELETE removal policy', () => {
    template.hasResource('AWS::S3::Bucket', {
      UpdateReplacePolicy: 'Delete',
      DeletionPolicy: 'Delete',
    });
  });

  test('should create a KMS Key for VPC flow logs with DELETE removal policy', () => {
    template.hasResource('AWS::KMS::Key', {
      Properties: Match.objectLike({
        Description: 'log-vpc-key',
      }),
      UpdateReplacePolicy: 'Delete',
      DeletionPolicy: 'Delete',
    });
  });

  test('should create a KMS Key for EKS secrets with DELETE removal policy', () => {
    template.hasResource('AWS::KMS::Key', {
      Properties: Match.objectLike({
        Description: 'eks-secrets-key',
      }),
      UpdateReplacePolicy: 'Delete',
      DeletionPolicy: 'Delete',
    });
  });

  test('should create a log group for VPC flow log with DELETE removal policy', () => {
    template.hasResource('AWS::Logs::LogGroup', {
      Properties: Match.objectLike({
        LogGroupName: '/aws/emr-eks-vpc-flow/data-platform',
      }),
      UpdateReplacePolicy: 'Delete',
      DeletionPolicy: 'Delete',
    });
  });
});

describe('With DESTROY removal policy and global data removal unset, the construct ', () => {

  const emrEksClusterStack = new Stack();

  const kubectlLayer = new KubectlV27Layer(emrEksClusterStack, 'kubectlLayer');

  const adminRole = Role.fromRoleArn(emrEksClusterStack, 'AdminRole', 'arn:aws:iam::123445678901:role/eks-admin');

  SparkEmrContainersRuntime.getOrCreate(emrEksClusterStack, {
    eksAdminRole: adminRole,
    publicAccessCIDRs: ['10.0.0.0/32'],
    kubectlLambdaLayer: kubectlLayer,
    removalPolicy: RemovalPolicy.DESTROY,
  });

  const template = Template.fromStack(emrEksClusterStack);
  // console.log(JSON.stringify(template.toJSON(), null, 2));

  test('should create a Karpenter queue with RETAIN removal policy', () => {
    template.hasResource('AWS::SQS::Queue', {
      UpdateReplacePolicy: 'Retain',
      DeletionPolicy: 'Retain',
    });
  });

  test('should create a pod template Bucket with RETAIN removal policy', () => {
    template.hasResource('AWS::S3::Bucket', {
      UpdateReplacePolicy: 'Retain',
      DeletionPolicy: 'Retain',
    });
  });

  test('should create a KMS Key for VPC flow logs with RETAIN removal policy', () => {
    template.hasResource('AWS::KMS::Key', {
      Properties: Match.objectLike({
        Description: 'log-vpc-key',
      }),
      UpdateReplacePolicy: 'Retain',
      DeletionPolicy: 'Retain',
    });
  });

  test('should create a KMS Key for EKS secrets with RETAIN removal policy', () => {
    template.hasResource('AWS::KMS::Key', {
      Properties: Match.objectLike({
        Description: 'eks-secrets-key',
      }),
      UpdateReplacePolicy: 'Retain',
      DeletionPolicy: 'Retain',
    });
  });

  test('should create a log group for VPC flow log with RETAIN removal policy', () => {
    template.hasResource('AWS::Logs::LogGroup', {
      Properties: Match.objectLike({
        LogGroupName: '/aws/emr-eks-vpc-flow/data-platform',
      }),
      UpdateReplacePolicy: 'Retain',
      DeletionPolicy: 'Retain',
    });
  });
});

describe('With provided EKS cluster, the construct ', () => {

  const emrEksClusterStack = new Stack();

  const kubectlLayer = new KubectlV27Layer(emrEksClusterStack, 'kubectlLayer');

  const adminRole = Role.fromRoleArn(emrEksClusterStack, 'AdminRole', 'arn:aws:iam::123445678901:role/eks-admin');

  const cluster = new Cluster(emrEksClusterStack, 'Cluster', {
    clusterName: 'myName',
    version: KubernetesVersion.V1_28,
  })

  SparkEmrContainersRuntime.getOrCreate(emrEksClusterStack, {
    eksCluster: cluster,
    eksClusterName: cluster.clusterName,
    eksAdminRole: adminRole,
    publicAccessCIDRs: ['10.0.0.0/32'],
    kubectlLambdaLayer: kubectlLayer,
    removalPolicy: RemovalPolicy.DESTROY,
  });

  const template = Template.fromStack(emrEksClusterStack);
  console.log(JSON.stringify(template.toJSON(), null, 2));

  test('should not create any VPC or any EKS Cluster', () => {
    template.resourceCountIs('Custom::AWSCDK-EKS-Cluster', 0);
    template.resourceCountIs('AWS::EC2::VPC', 0);
    template.resourceCountIs('AWS::EC2::Subnet', 0);
    template.resourceCountIs('AWS::EC2::RouteTable', 0);
    template.resourceCountIs('AWS::EC2::SubnetRouteTableAssociation', 0);
    template.resourceCountIs('AWS::EC2::Route', 0);
    template.resourceCountIs('AWS::EC2::EIP', 0);
    template.resourceCountIs('AWS::EC2::NatGateway', 0);
    template.resourceCountIs('AWS::EC2::InternetGateway', 0);
    template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 0);
    template.resourceCountIs('AWS::EC2::FlowLog', 0);
    template.resourceCountIs('AWS::EC2::VPCEndpoint', 0);
    template.resourceCountIs('AWS::Logs::LogGroup', 0);
  });

  test('should not configure the cluster with cert managed, EBS CSI driver and Karpenter', () => {
    template.resourceCountIs('Custom::AWSCDK-EKS-Cluster', 0);
    template.resourceCountIs('AWS::EC2::VPC', 0);
    template.resourceCountIs('AWS::EC2::Subnet', 0);
    template.resourcePropertiesCountIs('Custom::AWSCDK-EKS-HelmChart', {
      Chart: 'cert-manager',
      Repository: 'https://charts.jetstack.io',
      Namespace: 'cert-manager',
    }, 0);
  });

});
