// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { join } from 'path';
import { Duration, RemovalPolicy, Stack, Tags } from 'aws-cdk-lib';
import { SubnetType, ISubnet, SecurityGroup, Port, ISecurityGroup } from 'aws-cdk-lib/aws-ec2';
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import { HelmChart, ICluster } from 'aws-cdk-lib/aws-eks';
import { IRule, Rule } from 'aws-cdk-lib/aws-events';
import { SqsQueue } from 'aws-cdk-lib/aws-events-targets';
import { IRole, PolicyStatement, Effect, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { IQueue, Queue } from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import { SparkEmrContainersRuntime } from './spark-emr-containers-runtime';
import { Context, Utils } from '../../../../utils';
import { KarpenterVersion } from '../../karpenter-releases';

/**
 * @internal
 * Method to add the default Karpenter provisioners for Spark workloads
 * @param cluster the EMR on EKS cluster to configure the Karpenter provisioners in
 * @param karpenterVersion the Karpenter version to use for the provisioners
 * @param nodeRole the IAM role to use for the provisioners
 */
export function setDefaultKarpenterProvisioners(
  scope: Construct,
  cluster: SparkEmrContainersRuntime,
  karpenterVersion: KarpenterVersion,
  nodeRole: IRole) {

  const subnets = cluster.eksCluster.vpc.selectSubnets({
    onePerAz: true,
    subnetType: SubnetType.PRIVATE_WITH_EGRESS,
  }).subnets;

  //Build a container image using the following Dockerfile: Dockerfile-nvme-raid0-mount and upload it to ECR
  //The container is used by bottlerocket bootstrap container to execute a
  //userData script which strip nvme ephemeral storage to raid0 and mount it
  const dockerImageAsset = new DockerImageAsset(scope, 'NvmeRaid0MountImage', {
    directory: join(__dirname, `resources/k8s/karpenter-provisioner-config/${karpenterVersion}`),
    file: 'Dockerfile-nvme-raid0-mount',
  });

  subnets.forEach((subnet, index) => {
    let criticalManifestYAML = karpenterManifestSetup(cluster.eksCluster, `${__dirname}/resources/k8s/karpenter-provisioner-config/${karpenterVersion}/critical-provisioner.yml`, subnet, nodeRole, dockerImageAsset.imageUri);
    cluster.addKarpenterNodePoolAndNodeClass(`karpenterCriticalManifest-${index}`, criticalManifestYAML);

    let sharedDriverManifestYAML = karpenterManifestSetup(cluster.eksCluster, `${__dirname}/resources/k8s/karpenter-provisioner-config/${karpenterVersion}/shared-driver-provisioner.yml`, subnet, nodeRole);
    cluster.addKarpenterNodePoolAndNodeClass(`karpenterSharedDriverManifest-${index}`, sharedDriverManifestYAML);

    let sharedExecutorManifestYAML = karpenterManifestSetup(cluster.eksCluster, `${__dirname}/resources/k8s/karpenter-provisioner-config/${karpenterVersion}/shared-executor-provisioner.yml`, subnet, nodeRole);
    cluster.addKarpenterNodePoolAndNodeClass(`karpenterSharedExecutorManifest-${index}`, sharedExecutorManifestYAML);

    let notebookDriverManifestYAML = karpenterManifestSetup(cluster.eksCluster, `${__dirname}/resources/k8s/karpenter-provisioner-config/${karpenterVersion}/notebook-driver-provisioner.yml`, subnet, nodeRole);
    cluster.addKarpenterNodePoolAndNodeClass(`karpenterNotebookDriverManifest-${index}`, notebookDriverManifestYAML);

    let notebookExecutorManifestYAML = karpenterManifestSetup(cluster.eksCluster, `${__dirname}/resources/k8s/karpenter-provisioner-config/${karpenterVersion}/notebook-executor-provisioner.yml`, subnet, nodeRole);
    cluster.addKarpenterNodePoolAndNodeClass(`karpenterNotebookExecutorManifest-${index}`, notebookExecutorManifestYAML);
  });
}

/**
   * @internal
   * Method to generate the Karpenter manifests from templates and targeted to the specific EKS cluster
   * @param cluster the name of the EKS cluster to target the manifests to
   * @param path the path to the manifest template
   * @param subnet the subnet to target the manifests to
   * @param nodeRole the IAM role to use for the manifests
   * @return the Kubernetes manifest for Karpenter provisioned
   */
export function karpenterManifestSetup(cluster: ICluster, path: string, subnet: ISubnet, nodeRole: IRole, imageUri?: string): any {

  let manifest = Utils.readYamlDocument(path);

  manifest = manifest.replace('{{subnet-id}}', subnet.subnetId);
  manifest = manifest.replace(/(\{{az}})/g, subnet.availabilityZone);
  manifest = manifest.replace('{{cluster-name}}', cluster.clusterName);
  manifest = manifest.replace(/(\{{ROLENAME}})/g, nodeRole.roleName);

  if (imageUri) {
    manifest = manifest.replace(/(\{{REPLACE-WITH-IMAGE-ECR}})/g, imageUri);
  }

  let manfifestYAML: any = manifest.split('---').map((e: any) => Utils.loadYaml(e));

  return manfifestYAML;
}

/**
   * @internal
   * Install all the required configurations of Karpenter SQS and Event rules to handle spot and unhealthy instance termination
   * Create a security group to be used by nodes created with karpenter
   * Tags the subnets and VPC to be used by karpenter
   * create a tooling provisioner that will deploy in each of the AZs, one per AZ
   * @param cluster the EKS cluster to configure the Karpenter provisioners in
   * @param clusterName the name of the EKS cluster to target the manifests to
   * @param instanceProfile the IAM instance profile to use for the Karpenter nodes
   * @param nodeRole the IAM role to use for the Karpenter nodes
   * @param karpenterVersion the Karpenter version to use for the provisioners
   * @return the Helm chart to install, the IAM Role for service account, the SQS queue and the EventBridge rules for Karpenter
   */
export function karpenterSetup(cluster: ICluster,
  clusterName: string,
  scope: Construct,
  nodeRole: IRole,
  karpenterRemovalPolicy: RemovalPolicy,
  karpenterVersion?: KarpenterVersion,
): [HelmChart, IRole, IQueue, ISecurityGroup, Array<IRule>] {

  const removalPolicy = Context.revertRemovalPolicy(scope, karpenterRemovalPolicy);

  const karpenterInterruptionQueue: Queue = new Queue(scope, 'KarpenterInterruptionQueue', {
    retentionPeriod: Duration.seconds(300),
    enforceSSL: true,
    removalPolicy,
  });

  karpenterInterruptionQueue.addToResourcePolicy(
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['sqs:SendMessage'],
      principals: [new ServicePrincipal('sqs.amazonaws.com'), new ServicePrincipal('events.amazonaws.com')],
    }),
  );

  const scheduledChangeRule = new Rule(scope, 'ScheduledChangeRule', {
    eventPattern: {
      source: ['aws.heatlh'],
      detail: ['AWS Health Event'],
    },
    targets: [new SqsQueue(karpenterInterruptionQueue)],
  });

  const stateChangeRule = new Rule(scope, 'InstanceStateChangeRule', {
    eventPattern: {
      source: ['aws.ec2'],
      detail: ['EC2 Instance State-change Notification'],
    },
    targets: [new SqsQueue(karpenterInterruptionQueue)],
  });

  const allowSSMReadActions: PolicyStatement = new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['ssm:GetParameter', 'pricing:GetProducts'],
    resources: ['*'],
  });

  const allowPricingReadActions: PolicyStatement = new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['pricing:GetProducts'],
    resources: ['*'],
  });

  const allowRegionalReadActions: PolicyStatement = new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'ec2:DescribeAvailabilityZones',
      'ec2:DescribeImages',
      'ec2:DescribeInstances',
      'ec2:DescribeInstanceTypeOfferings',
      'ec2:DescribeInstanceTypes',
      'ec2:DescribeLaunchTemplates',
      'ec2:DescribeSecurityGroups',
      'ec2:DescribeSpotPriceHistory',
      'ec2:DescribeSubnets',
    ],
    resources: ['*'],
    conditions: {
      StringEquals: {
        'aws:RequestedRegion': Stack.of(scope).region,
      },
    },
  });

  const allowScopedEC2InstanceAccessActions: PolicyStatement = new PolicyStatement({
    effect: Effect.ALLOW,
    resources: [
      `arn:aws:ec2:${Stack.of(scope).region}::image/*`,
      `arn:aws:ec2:${Stack.of(scope).region}::snapshot/*`,
      `arn:aws:ec2:${Stack.of(scope).region}:*:security-group/*`,
      `arn:aws:ec2:${Stack.of(scope).region}:*:subnet/*`,
    ],
    actions: ['ec2:RunInstances', 'ec2:CreateFleet'],
  });

  const allowScopedEC2LaunchTemplateAccessActions = new PolicyStatement({
    sid: 'AllowScopedEC2LaunchTemplateAccessActions',
    effect: Effect.ALLOW,
    resources: [`arn:${Stack.of(scope).partition}:ec2:${Stack.of(scope).region}:*:launch-template/*`],
    actions: [
      'ec2:RunInstances',
      'ec2:CreateFleet',
    ],
    conditions: {
      StringEquals: {
        [`aws:ResourceTag/kubernetes.io/cluster/${clusterName}`]: 'owned',
      },
      StringLike: {
        'aws:ResourceTag/karpenter.sh/nodepool': '*',
      },
    },
  });

  const allowScopedResourceCreationTagging = new PolicyStatement({
    sid: 'AllowScopedResourceCreationTagging',
    effect: Effect.ALLOW,
    resources: [
      `arn:${Stack.of(scope).partition}:ec2:${Stack.of(scope).region}:*:fleet/*`,
      `arn:${Stack.of(scope).partition}:ec2:${Stack.of(scope).region}:*:instance/*`,
      `arn:${Stack.of(scope).partition}:ec2:${Stack.of(scope).region}:*:volume/*`,
      `arn:${Stack.of(scope).partition}:ec2:${Stack.of(scope).region}:*:network-interface/*`,
      `arn:${Stack.of(scope).partition}:ec2:${Stack.of(scope).region}:*:launch-template/*`,
      `arn:${Stack.of(scope).partition}:ec2:${Stack.of(scope).region}:*:spot-instances-request/*`,
    ],
    actions: ['ec2:CreateTags'],
    conditions: {
      StringEquals: {
        [`aws:RequestTag/kubernetes.io/cluster/${clusterName}`]: 'owned',
        'aws:RequestTag/eks:eks-cluster-name': clusterName,
        'ec2:CreateAction': [
          'RunInstances',
          'CreateFleet',
          'CreateLaunchTemplate',
        ],
      },
      StringLike: {
        'aws:RequestTag/karpenter.sh/nodepool': '*',
      },
    },
  });


  const allowScopedResourceTagging = new PolicyStatement({
    sid: 'AllowScopedResourceTagging',
    effect: Effect.ALLOW,
    resources: [`arn:${Stack.of(scope).partition}:ec2:${Stack.of(scope).region}:*:instance/*`],
    actions: ['ec2:CreateTags'],
    conditions: {
      'StringEquals': {
        [`aws:ResourceTag/kubernetes.io/cluster/${clusterName}`]: 'owned',
      },
      'StringLike': {
        'aws:ResourceTag/karpenter.sh/nodepool': '*',
      },
      'StringEqualsIfExists': {
        'aws:RequestTag/eks:eks-cluster-name': clusterName,
      },
      'ForAllValues:StringEquals': {
        'aws:TagKeys': [
          'eks:eks-cluster-name',
          'karpenter.sh/nodeclaim',
          'Name',
        ],
      },
    },
  });


  const allowScopedDeletion = new PolicyStatement({
    sid: 'AllowScopedDeletion',
    effect: Effect.ALLOW,
    resources: [
      `arn:${Stack.of(scope).partition}:ec2:${Stack.of(scope).region}:*:instance/*`,
      `arn:${Stack.of(scope).partition}:ec2:${Stack.of(scope).region}:*:launch-template/*`,
    ],
    actions: [
      'ec2:TerminateInstances',
      'ec2:DeleteLaunchTemplate',
    ],
    conditions: {
      StringEquals: {
        [`aws:ResourceTag/kubernetes.io/cluster/${clusterName}`]: 'owned',
      },
      StringLike: {
        'aws:ResourceTag/karpenter.sh/nodepool': '*',
      },
    },
  });


  const allowScopedEC2InstanceActionsWithTags: PolicyStatement = new PolicyStatement({
    effect: Effect.ALLOW,
    resources: [
      `arn:aws:ec2:${Stack.of(scope).region}:*:fleet/*`,
      `arn:aws:ec2:${Stack.of(scope).region}:*:instance/*`,
      `arn:aws:ec2:${Stack.of(scope).region}:*:volume/*`,
      `arn:aws:ec2:${Stack.of(scope).region}:*:network-interface/*`,
      `arn:aws:ec2:${Stack.of(scope).region}:*:launch-template/*`,
      `arn:aws:ec2:${Stack.of(scope).region}:*:spot-instances-request/*`,
    ],
    actions: ['ec2:RunInstances', 'ec2:CreateFleet', 'ec2:CreateLaunchTemplate'],
    conditions: {
      StringEquals: {
        [`aws:RequestTag/kubernetes.io/cluster/${clusterName}`]: 'owned',
        'aws:RequestTag/eks:eks-cluster-name': clusterName,
      },
      StringLike: {
        'aws:RequestTag/karpenter.sh/nodepool': '*',
      },
    },
  });

  const allowPassingInstanceRole: PolicyStatement = new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['iam:PassRole'],
    resources: [`${nodeRole.roleArn}`],
    conditions: {
      StringEquals: {
        'iam:PassedToService': 'ec2.amazonaws.com',
      },
    },
  });

  const allowInterruptionQueueActions: PolicyStatement = new PolicyStatement({
    sid: 'AllowInterruptionQueueActions',
    effect: Effect.ALLOW,
    resources: [karpenterInterruptionQueue.queueArn],
    actions: ['sqs:DeleteMessage', 'sqs:GetQueueAttributes', 'sqs:GetQueueUrl', 'sqs:ReceiveMessage'],
  });

  const allowAPIServerEndpointDiscovery: PolicyStatement = new PolicyStatement({
    sid: 'AllowAPIServerEndpointDiscovery',
    effect: Effect.ALLOW,
    resources: [`arn:aws:eks:${Stack.of(scope).region}:${Stack.of(scope).account}:cluster/${clusterName}`],
    actions: ['eks:DescribeCluster'],
  });

  const allowScopedInstanceProfileCreationActions = new PolicyStatement({
    sid: 'AllowScopedInstanceProfileCreationActions',
    effect: Effect.ALLOW,
    resources: [`arn:${Stack.of(scope).partition}:iam::${Stack.of(scope).account}:instance-profile/*`],
    actions: ['iam:CreateInstanceProfile'],
    conditions: {
      StringEquals: {
        [`aws:RequestTag/kubernetes.io/cluster/${clusterName}`]: 'owned',
        'aws:RequestTag/eks:eks-cluster-name': clusterName,
        'aws:RequestTag/topology.kubernetes.io/region': Stack.of(scope).region,
      },
      StringLike: {
        'aws:RequestTag/karpenter.k8s.aws/ec2nodeclass': '*',
      },
    },
  });

  const allowScopedInstanceProfileTagActions = new PolicyStatement({
    sid: 'AllowScopedInstanceProfileTagActions',
    effect: Effect.ALLOW,
    resources: [`arn:${Stack.of(scope).partition}:iam::${Stack.of(scope).account}:instance-profile/*`],
    actions: ['iam:TagInstanceProfile'],
    conditions: {
      StringEquals: {
        [`aws:ResourceTag/kubernetes.io/cluster/${clusterName}`]: 'owned',
        'aws:ResourceTag/topology.kubernetes.io/region': Stack.of(scope).region,
        [`aws:RequestTag/kubernetes.io/cluster/${clusterName}`]: 'owned',
        'aws:RequestTag/eks:eks-cluster-name': clusterName,
        'aws:RequestTag/topology.kubernetes.io/region': Stack.of(scope).region,
      },
      StringLike: {
        'aws:ResourceTag/karpenter.k8s.aws/ec2nodeclass': '*',
        'aws:RequestTag/karpenter.k8s.aws/ec2nodeclass': '*',
      },
    },
  });

  const allowScopedInstanceProfileActions = new PolicyStatement({
    sid: 'AllowScopedInstanceProfileActions',
    effect: Effect.ALLOW,
    resources: [`arn:${Stack.of(scope).partition}:iam::${Stack.of(scope).account}:instance-profile/*`],
    actions: [
      'iam:AddRoleToInstanceProfile',
      'iam:RemoveRoleFromInstanceProfile',
      'iam:DeleteInstanceProfile',
    ],
    conditions: {
      StringEquals: {
        [`aws:ResourceTag/kubernetes.io/cluster/${clusterName}`]: 'owned',
        'aws:ResourceTag/topology.kubernetes.io/region': Stack.of(scope).region,
      },
      StringLike: {
        'aws:ResourceTag/karpenter.k8s.aws/ec2nodeclass': '*',
      },
    },
  });

  const allowInstanceProfileReadActions = new PolicyStatement({
    sid: 'AllowInstanceProfileReadActions',
    effect: Effect.ALLOW,
    resources: [`arn:${Stack.of(scope).partition}:iam::${Stack.of(scope).account}:instance-profile/*`],
    actions: ['iam:GetInstanceProfile'],
  });


  const karpenterNS = cluster.addManifest('karpenterNS', {
    apiVersion: 'v1',
    kind: 'Namespace',
    metadata: { name: 'karpenter' },
  });

  const karpenterAccount = cluster.addServiceAccount('karpenterServiceAccount', {
    name: 'karpenter',
    namespace: 'karpenter',
  });

  karpenterAccount.node.addDependency(karpenterNS);

  karpenterAccount.addToPrincipalPolicy(allowSSMReadActions);
  karpenterAccount.addToPrincipalPolicy(allowScopedEC2InstanceActionsWithTags);
  karpenterAccount.addToPrincipalPolicy(allowScopedEC2InstanceAccessActions);
  karpenterAccount.addToPrincipalPolicy(allowPricingReadActions);
  karpenterAccount.addToPrincipalPolicy(allowPassingInstanceRole);
  karpenterAccount.addToPrincipalPolicy(allowScopedInstanceProfileCreationActions);
  karpenterAccount.addToPrincipalPolicy(allowScopedInstanceProfileTagActions);
  karpenterAccount.addToPrincipalPolicy(allowScopedInstanceProfileActions);
  karpenterAccount.addToPrincipalPolicy(allowScopedResourceTagging);
  karpenterAccount.addToPrincipalPolicy(allowScopedResourceCreationTagging);
  karpenterAccount.addToPrincipalPolicy(allowScopedDeletion);
  karpenterAccount.addToPrincipalPolicy(allowInterruptionQueueActions);
  karpenterAccount.addToPrincipalPolicy(allowAPIServerEndpointDiscovery);
  karpenterAccount.addToPrincipalPolicy(allowInstanceProfileReadActions);
  karpenterAccount.addToPrincipalPolicy(allowRegionalReadActions);
  karpenterAccount.addToPrincipalPolicy(allowScopedEC2LaunchTemplateAccessActions);

  //Deploy Karpenter Chart
  const karpenterChart = cluster.addHelmChart('KarpenterHelmChart', {
    chart: 'karpenter',
    release: 'karpenter',
    repository: 'oci://public.ecr.aws/karpenter/karpenter',
    namespace: 'karpenter',
    version: karpenterVersion,
    timeout: Duration.minutes(14),
    wait: true,
    values: {
      serviceAccount: {
        name: 'karpenter',
        create: false,
        annotations: {
          'eks.amazonaws.com/role-arn': karpenterAccount.role.roleArn,
        },
      },
      settings: {
        clusterName: clusterName,
        clusterEndpoint: cluster.clusterEndpoint,
        interruptionQueueName: karpenterInterruptionQueue.queueName,
      },

    },
  });

  karpenterChart.node.addDependency(karpenterAccount);

  const karpenterInstancesSg = new SecurityGroup(scope, 'KarpenterSg', {
    vpc: cluster.vpc,
    allowAllOutbound: true,
    description: 'security group for a karpenter instances',
    disableInlineRules: true,
  });

  Tags.of(karpenterInstancesSg).add('karpenter.sh/discovery', `${clusterName}`);

  cluster.clusterSecurityGroup.addIngressRule(
    karpenterInstancesSg,
    Port.allTraffic(),
  );

  karpenterInstancesSg.addIngressRule(
    karpenterInstancesSg,
    Port.allTraffic(),
  );

  karpenterInstancesSg.addIngressRule(
    cluster.clusterSecurityGroup,
    Port.allTraffic(),
  );

  Tags.of(cluster.vpc).add(
    'karpenter.sh/discovery', clusterName,
  );

  cluster.vpc.privateSubnets.forEach((subnet) => {
    Tags.of(subnet).add('karpenter.sh/discovery', clusterName);
  });

  cluster.vpc.publicSubnets.forEach((subnet) =>
    Tags.of(subnet).add('karpenter.sh/discovery', clusterName),
  );

  const privateSubnets = cluster.vpc.selectSubnets({
    onePerAz: true,
    subnetType: SubnetType.PRIVATE_WITH_EGRESS,
  }).subnets;

  let manifest = Utils.readYamlDocument(`${__dirname}/resources/k8s/karpenter-provisioner-config/${karpenterVersion}/tooling-provisioner.yml`);

  manifest = manifest.replace(/(\{{cluster-name}})/g, clusterName);

  manifest = manifest.replace(/(\{{ROLENAME}})/g, nodeRole.roleName);

  const subnetIdHolder: string[] = ['subnet-1', 'subnet-2'];

  privateSubnets.forEach((subnet, index) => {

    let subnetHolder = `{{${subnetIdHolder[index]}}}`;
    let re = new RegExp(subnetHolder, 'g');
    manifest = manifest.replace(re, subnet.subnetId);

  });

  let manfifestYAML: any = manifest.split('---').map((e: any) => Utils.loadYaml(e));

  const manifestApply = cluster.addManifest('provisioner-tooling', ...manfifestYAML);

  manifestApply.node.addDependency(karpenterChart);

  return [karpenterChart, karpenterAccount.role, karpenterInterruptionQueue, karpenterInstancesSg, [scheduledChangeRule, stateChangeRule]];
}