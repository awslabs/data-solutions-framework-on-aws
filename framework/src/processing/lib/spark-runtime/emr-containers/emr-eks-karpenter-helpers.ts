// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Duration, Stack, Tags } from 'aws-cdk-lib';
import { SubnetType, ISubnet, SecurityGroup, Port } from 'aws-cdk-lib/aws-ec2';
import { HelmChart, Cluster } from 'aws-cdk-lib/aws-eks';
import { Rule } from 'aws-cdk-lib/aws-events';
import { SqsQueue } from 'aws-cdk-lib/aws-events-targets';
import { CfnInstanceProfile, IRole, PolicyStatement, Effect, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import { SparkEmrContainersRuntime } from './emr-eks-cluster';
import { Utils } from '../../../../utils';
import { KarpenterVersion } from '../../karpenter-releases';

/**
 * @internal
 * Method to add the default Karpenter provisioners for Spark workloads
 * @param {Cluster} cluster the EMR on EKS cluster to configure the Karpenter provisioners in
 * @param {KarpenterVersion} karpenterVersion the Karpenter version to use for the provisioners
 * @param {IRole} nodeRole the IAM role to use for the provisioners
 */
export function setDefaultKarpenterProvisioners(cluster: SparkEmrContainersRuntime, karpenterVersion: KarpenterVersion, nodeRole: IRole) {

  const subnets = cluster.eksCluster.vpc.selectSubnets({
    onePerAz: true,
    subnetType: SubnetType.PRIVATE_WITH_EGRESS,
  }).subnets;

  subnets.forEach( (subnet, index) => {
    let criticalManifestYAML = karpenterManifestSetup(cluster.eksCluster, `${__dirname}/resources/k8s/karpenter-provisioner-config/${karpenterVersion}/critical-provisioner.yml`, subnet, nodeRole);
    cluster.addKarpenterProvisioner(`karpenterCriticalManifest-${index}`, criticalManifestYAML);

    let sharedDriverManifestYAML = karpenterManifestSetup(cluster.eksCluster, `${__dirname}/resources/k8s/karpenter-provisioner-config/${karpenterVersion}/shared-driver-provisioner.yml`, subnet, nodeRole);
    cluster.addKarpenterProvisioner(`karpenterSharedDriverManifest-${index}`, sharedDriverManifestYAML);

    let sharedExecutorManifestYAML = karpenterManifestSetup(cluster.eksCluster, `${__dirname}/resources/k8s/karpenter-provisioner-config/${karpenterVersion}/shared-executor-provisioner.yml`, subnet, nodeRole);
    cluster.addKarpenterProvisioner(`karpenterSharedExecutorManifest-${index}`, sharedExecutorManifestYAML);

    let notebookDriverManifestYAML = karpenterManifestSetup(cluster.eksCluster, `${__dirname}/resources/k8s/karpenter-provisioner-config/${karpenterVersion}/notebook-driver-provisioner.yml`, subnet, nodeRole);
    cluster.addKarpenterProvisioner(`karpenterNotebookDriverManifest-${index}`, notebookDriverManifestYAML);

    let notebookExecutorManifestYAML = karpenterManifestSetup(cluster.eksCluster, `${__dirname}/resources/k8s/karpenter-provisioner-config/${karpenterVersion}/notebook-executor-provisioner.yml`, subnet, nodeRole);
    cluster.addKarpenterProvisioner(`karpenterNotebookExecutorManifest-${index}`, notebookExecutorManifestYAML);
  });
}

/**
   * @internal
   * Method to generate the Karpenter manifests from templates and targeted to the specific EKS cluster
   * @param {string} clusterName the name of the EKS cluster to target the manifests to
   * @param {string} path the path to the manifest template
   * @param {ISubnet} subnet the subnet to target the manifests to
   * @param {IRole} nodeRole the IAM role to use for the manifests
   * @return {any} the Kubernetes manifest for Karpenter provisioned
   */
export function karpenterManifestSetup(cluster: Cluster, path: string, subnet: ISubnet, nodeRole: IRole): any {

  let manifest = Utils.readYamlDocument(path);

  manifest = manifest.replace('{{subnet-id}}', subnet.subnetId);
  manifest = manifest.replace( /(\{{az}})/g, subnet.availabilityZone);
  manifest = manifest.replace('{{cluster-name}}', cluster.clusterName);
  manifest = manifest.replace(/(\{{ROLENAME}})/g, nodeRole.roleName);

  let manfifestYAML: any = manifest.split('---').map((e: any) => Utils.loadYaml(e));

  return manfifestYAML;
}

/**
   * @internal
   * Install all the required configurations of Karpenter SQS and Event rules to handle spot and unhealthy instance termination
   * Create a security group to be used by nodes created with karpenter
   * Tags the subnets and VPC to be used by karpenter
   * create a tooling provisioner that will deploy in each of the AZs, one per AZ
   * @param {Cluster} cluster the EKS cluster to configure the Karpenter provisioners in
   * @param {string} clusterName the name of the EKS cluster to target the manifests to
   * @param {CfnInstanceProfile} instanceProfile the IAM instance profile to use for the Karpenter nodes
   * @param {IRole} nodeRole the IAM role to use for the Karpenter nodes
   * @param {KarpenterVersion} karpenterVersion the Karpenter version to use for the provisioners
   * @return {HelmChart} the Karpenter Helm chart to install
   */
export function karpenterSetup(cluster: Cluster,
  clusterName: string,
  scope: Construct,
  instanceProfile: CfnInstanceProfile,
  nodeRole: IRole,
  karpenterVersion?: KarpenterVersion,
): HelmChart {

  const karpenterInterruptionQueue: Queue = new Queue(scope, 'karpenterInterruptionQueue', {
    queueName: clusterName,
    retentionPeriod: Duration.seconds(300),
    enforceSSL: true,
  });

  karpenterInterruptionQueue.addToResourcePolicy(
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['sqs:SendMessage'],
      principals: [new ServicePrincipal('sqs.amazonaws.com'), new ServicePrincipal('events.amazonaws.com')],
    }),
  );

  new Rule(scope, 'scheduledChangeRule', {
    eventPattern: {
      source: ['aws.heatlh'],
      detail: ['AWS Health Event'],
    },
    targets: [new SqsQueue(karpenterInterruptionQueue)],
  });

  new Rule(scope, 'instanceStateChangeRule', {
    eventPattern: {
      source: ['aws.ec2'],
      detail: ['EC2 Instance State-change Notification'],
    },
    targets: [new SqsQueue(karpenterInterruptionQueue)],
  });

  const karpenterControllerPolicyStatementSSM: PolicyStatement = new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['ssm:GetParameter', 'pricing:GetProducts'],
    resources: ['*'],
  });

  const karpenterControllerPolicyStatementEC2: PolicyStatement = new PolicyStatement({
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

  const allowScopedEC2InstanceActions: PolicyStatement = new PolicyStatement({
    effect: Effect.ALLOW,
    resources: [
      `arn:aws:ec2:${Stack.of(scope).region}::image/*`,
      `arn:aws:ec2:${Stack.of(scope).region}::snapshot/*`,
      `arn:aws:ec2:${Stack.of(scope).region}:*:spot-instances-request/*`,
      `arn:aws:ec2:${Stack.of(scope).region}:*:security-group/*`,
      `arn:aws:ec2:${Stack.of(scope).region}:*:subnet/*`,
      `arn:aws:ec2:${Stack.of(scope).region}:*:launch-template/*`,
    ],
    actions: ['ec2:RunInstances', 'ec2:CreateFleet'],
  });

  const allowScopedEC2LaunchTemplateActions: PolicyStatement = new PolicyStatement({
    effect: Effect.ALLOW,
    resources: [`arn:aws:ec2:${Stack.of(scope).region}:*:launch-template/*`],
    actions: ['ec2:CreateLaunchTemplate'],
    conditions: {
      StringEquals: {
        [`aws:RequestTag/kubernetes.io/cluster/${clusterName}`]: 'owned',
      },
      StringLike: {
        'aws:RequestTag/karpenter.sh/provisioner-name': '*',
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
    ],
    actions: ['ec2:RunInstances', 'ec2:CreateFleet'],
    conditions: {
      StringEquals: {
        [`aws:RequestTag/kubernetes.io/cluster/${clusterName}`]: 'owned',
      },
      StringLike: {
        'aws:RequestTag/karpenter.sh/provisioner-name': '*',
      },
    },
  });

  const allowScopedResourceCreationTagging: PolicyStatement = new PolicyStatement({
    sid: 'AllowScopedResourceCreationTagging',
    effect: Effect.ALLOW,
    resources: [
      `arn:aws:ec2:${Stack.of(scope).region}:*:fleet/*`,
      `arn:aws:ec2:${Stack.of(scope).region}:*:instance/*`,
      `arn:aws:ec2:${Stack.of(scope).region}:*:volume/*`,
      `arn:aws:ec2:${Stack.of(scope).region}:*:network-interface/*`,
      `arn:aws:ec2:${Stack.of(scope).region}:*:launch-template/*`,
    ],
    actions: ['ec2:CreateTags'],
    conditions: {
      StringEquals: {
        [`aws:RequestTag/kubernetes.io/cluster/${clusterName}`]: 'owned',
        'ec2:CreateAction': ['RunInstances', 'CreateFleet', 'CreateLaunchTemplate'],
      },
      StringLike: {
        'aws:RequestTag/karpenter.sh/provisioner-name': '*',
      },
    },
  });

  const allowMachineMigrationTagging: PolicyStatement = new PolicyStatement({
    sid: 'AllowMachineMigrationTagging',
    effect: Effect.ALLOW,
    resources: [`arn:aws:ec2:${Stack.of(scope).region}:*:instance/*`],
    actions: ['ec2:CreateTags'],
    conditions: {
      'StringEquals': {
        [`aws:ResourceTag/kubernetes.io/cluster/${clusterName}`]: 'owned',
        'aws:RequestTag/karpenter.sh/managed-by': `${clusterName}`,
      },
      'StringLike': {
        'aws:RequestTag/karpenter.sh/provisioner-name': '*',
      },
      'ForAllValues:StringEquals': {
        'aws:TagKeys': ['karpenter.sh/provisioner-name', 'karpenter.sh/managed-by'],
      },
    },
  });

  const allowScopedDeletion: PolicyStatement = new PolicyStatement({
    sid: 'AllowScopedDeletion',
    effect: Effect.ALLOW,
    resources: [
      `arn:aws:ec2:${Stack.of(scope).region}:*:instance/*`,
      `arn:aws:ec2:${Stack.of(scope).region}:*:launch-template/*`,
    ],
    actions: ['ec2:TerminateInstances', 'ec2:DeleteLaunchTemplate'],
    conditions: {
      StringEquals: {
        [`aws:ResourceTag/kubernetes.io/cluster/${clusterName}`]: 'owned',
      },
      StringLike: {
        'aws:ResourceTag/karpenter.sh/provisioner-name': '*',
      },
    },
  });

  const karpenterControllerPolicyStatementIAM: PolicyStatement = new PolicyStatement({
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

  const allowAPIServerEndpointDiscovery : PolicyStatement = new PolicyStatement({
    sid: 'AllowAPIServerEndpointDiscovery',
    effect: Effect.ALLOW,
    resources: [`arn:aws:eks:${Stack.of(scope).region}:${Stack.of(scope).account}:cluster/${clusterName}`],
    actions: ['eks:DescribeCluster'],
  });

  const allowInstanceProfileReadActions: PolicyStatement = new PolicyStatement({
    sid: 'AllowInstanceProfileReadActions',
    effect: Effect.ALLOW,
    resources: ['*'],
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

  karpenterAccount.addToPrincipalPolicy(karpenterControllerPolicyStatementSSM);
  karpenterAccount.addToPrincipalPolicy(karpenterControllerPolicyStatementEC2);
  karpenterAccount.addToPrincipalPolicy(karpenterControllerPolicyStatementIAM);
  karpenterAccount.addToPrincipalPolicy(allowScopedEC2InstanceActions);
  karpenterAccount.addToPrincipalPolicy(allowScopedEC2InstanceActionsWithTags);
  karpenterAccount.addToPrincipalPolicy(allowScopedEC2LaunchTemplateActions);
  karpenterAccount.addToPrincipalPolicy(allowMachineMigrationTagging);
  karpenterAccount.addToPrincipalPolicy(allowScopedResourceCreationTagging);
  karpenterAccount.addToPrincipalPolicy(allowScopedDeletion);
  karpenterAccount.addToPrincipalPolicy(allowInterruptionQueueActions);
  karpenterAccount.addToPrincipalPolicy(allowAPIServerEndpointDiscovery);
  karpenterAccount.addToPrincipalPolicy(allowInstanceProfileReadActions);

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
        aws: {
          defaultInstanceProfile: instanceProfile.instanceProfileName,
          clusterName: clusterName,
          clusterEndpoint: cluster.clusterEndpoint,
          interruptionQueueName: karpenterInterruptionQueue.queueName,
        },
      },

    },
  });

  karpenterChart.node.addDependency(karpenterAccount);

  const karpenterInstancesSg = new SecurityGroup(scope, 'karpenterSg', {
    vpc: cluster.vpc,
    allowAllOutbound: true,
    description: 'security group for a karpenter instances',
    securityGroupName: 'karpenterSg',
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

  return karpenterChart;
}