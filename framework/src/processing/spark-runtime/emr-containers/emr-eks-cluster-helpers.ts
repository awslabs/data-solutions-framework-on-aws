// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Duration, Stack, Tags } from 'aws-cdk-lib';
import { CfnLaunchTemplate, ISubnet, InstanceType, Port, SecurityGroup, SubnetType } from 'aws-cdk-lib/aws-ec2';
import { Cluster, HelmChart, KubernetesManifest, CfnAddon, NodegroupOptions, NodegroupAmiType, KubernetesVersion } from 'aws-cdk-lib/aws-eks';
import { Rule } from 'aws-cdk-lib/aws-events';
import { SqsQueue } from 'aws-cdk-lib/aws-events-targets';
import { CfnInstanceProfile, Effect, FederatedPrincipal, ManagedPolicy, Policy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import { CERTMANAGER_HELM_CHART_VERSION, EBS_CSI_DRIVER_ADDON_VERSION } from './eks-support-controllers-version';
import { SparkEmrContainersRuntime } from './emr-eks-cluster';
import * as IamPolicyEbsCsiDriver from './resources/k8s/controllers-iam-policies/iam-policy-ebs-csi-driver.json';
import { Utils } from '../../../utils';


/**
 * @internal
 * Setup the EKS cluster with the right controllers to function
 *
 * @param {Cluster} cluster the unique ID of the CDK resource
 * @param {Construct} scope The local path of the yaml podTemplate files to upload
 * @param {string} eksAdminRoleArn The admin role of the EKS cluster
 * @param {Role} nodeRole The IAM role used for instance profile by Karpenter
 * @param {KubernetesVersion} eksClusterK8sVersion the k8s version for the EKS cluster
 */
export function eksClusterSetup(
  cluster: Cluster,
  scope: Construct,
  eksAdminRoleArn: string,
  nodeRole: Role,
  eksClusterK8sVersion: KubernetesVersion) {

  // Add the provided Amazon IAM Role as Amazon EKS Admin
  cluster.awsAuth.addMastersRole(Role.fromRoleArn( scope, 'AdminRole', eksAdminRoleArn ), 'AdminRole');

  const ebsCsiDriverIrsa = cluster.addServiceAccount('ebsCSIDriverRoleSA', {
    name: 'ebs-csi-controller-sa',
    namespace: 'kube-system',
  });

  const ebsCsiDriverPolicyDocument = PolicyDocument.fromJson(IamPolicyEbsCsiDriver);

  const ebsCsiDriverPolicy = new Policy(
    scope,
    'IamPolicyEbsCsiDriverIAMPolicy',
    { document: ebsCsiDriverPolicyDocument },
  );

  ebsCsiDriverPolicy.attachToRole(ebsCsiDriverIrsa.role);

  const ebsCSIDriver = new CfnAddon(scope, 'ebsCsiDriver', {
    addonName: 'aws-ebs-csi-driver',
    clusterName: cluster.clusterName,
    serviceAccountRoleArn: ebsCsiDriverIrsa.role.roleArn,
    addonVersion: EBS_CSI_DRIVER_ADDON_VERSION.get(eksClusterK8sVersion),
    resolveConflicts: 'OVERWRITE',
  });

  ebsCSIDriver.node.addDependency(ebsCsiDriverIrsa);

  // Deploy the Helm Chart for the Certificate Manager. Required for EMR Studio ALB.
  cluster.addHelmChart('CertManager', {
    createNamespace: true,
    namespace: 'cert-manager',
    chart: 'cert-manager',
    repository: 'https://charts.jetstack.io',
    version: CERTMANAGER_HELM_CHART_VERSION.get(eksClusterK8sVersion),
    timeout: Duration.minutes(14),
    values: {
      startupapicheck: {
        timeout: '5m',
      },
      installCRDs: true,
    },
  });

  // Nodegroup capacity needed for all the tooling components including Karpenter
  toolingManagedNodegroupSetup(scope, cluster, nodeRole);


  //IAM role created for the aws-node pod following AWS best practice not to use the EC2 instance role
  const awsNodeRole: Role = new Role(scope, 'awsNodeRole', {
    assumedBy: new FederatedPrincipal(
      cluster.openIdConnectProvider.openIdConnectProviderArn,
      { ...[] },
      'sts:AssumeRoleWithWebIdentity',
    ),
    roleName: `awsNodeRole-${cluster.clusterName}`,
    managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('AmazonEKS_CNI_Policy')],
  });

  // update the aws-node service account with IAM role created for it
  new KubernetesManifest(scope, 'awsNodeServiceAccountUpdateManifest', {
    cluster: cluster,
    manifest: [
      {
        apiVersion: 'v1',
        kind: 'ServiceAccount',
        metadata: {
          name: 'aws-node',
          namespace: 'kube-system',
          annotations: {
            'eks.amazonaws.com/role-arn': awsNodeRole.roleArn,
          },
        },
      },
    ],
    overwrite: true,
  });

}
/**
 * @internal
 * Method to setup a managed nodegroup to bootstrap all cluster vital componenets like
 * core dns, karpenter, ebs csi driver
 */
function toolingManagedNodegroupSetup (scope: Construct, cluster: Cluster, nodeRole: Role) {

  // Add headers and footers to user data and install SSM agent
  //The below user data need to be formated as is,
  //if it gets linted, we have spaces/tabs that break the launchtemplate
  //Which in turn break and fail the deployment

//   const userData = `MIME-Version: 1.0
// Content-Type: multipart/mixed; boundary="==MYBOUNDARY=="

// --==MYBOUNDARY==
// Content-Type: text/x-shellscript; charset="us-ascii"

// #!/bin/bash
// yum install -y https://s3.amazonaws.com/ec2-downloads-windows/SSMAgent/latest/linux_amd64/amazon-ssm-agent.rpm
// systemctl enable amazon-ssm-agent
// systemctl start amazon-ssm-agent

// --==MYBOUNDARY==--\\
// `;

  const toolingLaunchTemplate: CfnLaunchTemplate = new CfnLaunchTemplate(scope, 'toolinglaunchtemplate', {
    launchTemplateName: 'ToolingNodegroup',

    launchTemplateData: {
      //userData: Fn.base64(userData),
      metadataOptions: {
        httpEndpoint: 'enabled',
        httpProtocolIpv6: 'disabled',
        httpPutResponseHopLimit: 2,
        httpTokens: 'required',
      },
    },
  });

  let toolingManagedNodegroupOptions: NodegroupOptions = {
    nodegroupName: 'tooling',
    instanceTypes: [new InstanceType('t3.medium')],
    amiType: NodegroupAmiType.BOTTLEROCKET_X86_64,
    minSize: 2,
    maxSize: 2,
    labels: { role: 'tooling' },
    launchTemplateSpec: {
      id: toolingLaunchTemplate.ref,
      version: toolingLaunchTemplate.attrLatestVersionNumber,
    },
    nodeRole: nodeRole,
  };


  cluster.addNodegroupCapacity('toolingMNG', toolingManagedNodegroupOptions);
}

/**
 * @internal
 * Method to add the default Karpenter provisioners for Spark workloads
 */
export function setDefaultKarpenterProvisioners(cluster: SparkEmrContainersRuntime, karpenterVersion: string) {
  const subnets = cluster.eksCluster.vpc.selectSubnets({
    onePerAz: true,
    subnetType: SubnetType.PRIVATE_WITH_EGRESS,
  }).subnets;

  subnets.forEach( (subnet, index) => {
    let criticalManifestYAML = karpenterManifestSetup(cluster.clusterName, `${__dirname}/resources/k8s/karpenter-provisioner-config/${karpenterVersion}/critical-provisioner.yml`, subnet);
    cluster.addKarpenterProvisioner(`karpenterCriticalManifest-${index}`, criticalManifestYAML);

    let sharedDriverManifestYAML = karpenterManifestSetup(cluster.clusterName, `${__dirname}/resources/k8s/karpenter-provisioner-config/${karpenterVersion}/shared-driver-provisioner.yml`, subnet);
    cluster.addKarpenterProvisioner(`karpenterSharedDriverManifest-${index}`, sharedDriverManifestYAML);

    let sharedExecutorManifestYAML = karpenterManifestSetup(cluster.clusterName, `${__dirname}/resources/k8s/karpenter-provisioner-config/${karpenterVersion}/shared-executor-provisioner.yml`, subnet);
    cluster.addKarpenterProvisioner(`karpenterSharedExecutorManifest-${index}`, sharedExecutorManifestYAML);

    let notebookDriverManifestYAML = karpenterManifestSetup(cluster.clusterName, `${__dirname}/resources/k8s/karpenter-provisioner-config/${karpenterVersion}/notebook-driver-provisioner.yml`, subnet);
    cluster.addKarpenterProvisioner(`karpenterNotebookDriverManifest-${index}`, notebookDriverManifestYAML);

    let notebookExecutorManifestYAML = karpenterManifestSetup(cluster.clusterName, `${__dirname}/resources/k8s/karpenter-provisioner-config/${karpenterVersion}/notebook-executor-provisioner.yml`, subnet);
    cluster.addKarpenterProvisioner(`karpenterNotebookExecutorManifest-${index}`, notebookExecutorManifestYAML);
  });
}

/**
 * @internal
 * Method to generate the Karpenter manifests from templates and targeted to the specific EKS cluster
 */
export function karpenterManifestSetup(clusterName: string, path: string, subnet: ISubnet): any {

  let manifest = Utils.readYamlDocument(path);

  manifest = manifest.replace('{{subnet-id}}', subnet.subnetId);
  manifest = manifest.replace( /(\{{az}})/g, subnet.availabilityZone);
  manifest = manifest.replace('{{cluster-name}}', clusterName);

  let manfifestYAML: any = manifest.split('---').map((e: any) => Utils.loadYaml(e));

  return manfifestYAML;
}

/**
 * @internal
 * Install all the required configurations of Karpenter SQS and Event rules to handle spot and unhealthy instance termination
 * Create a security group to be used by nodes created with karpenter
 * Tags the subnets and VPC to be used by karpenter
 * create a tooling provisioner that will deploy in each of the AZs, one per AZ
 */
export function karpenterSetup(cluster: Cluster,
  eksClusterName: string,
  scope: Construct,
  instanceProfile: CfnInstanceProfile,
  nodeRole: Role,
  karpenterVersion?: string,
): HelmChart {

  const karpenterInterruptionQueue: Queue = new Queue(scope, 'karpenterInterruptionQueue', {
    queueName: eksClusterName,
    retentionPeriod: Duration.seconds(300),
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
        [`aws:RequestTag/kubernetes.io/cluster/${eksClusterName}`]: 'owned',
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
        [`aws:RequestTag/kubernetes.io/cluster/${eksClusterName}`]: 'owned',
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
        [`aws:RequestTag/kubernetes.io/cluster/${eksClusterName}`]: 'owned',
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
        [`aws:ResourceTag/kubernetes.io/cluster/${eksClusterName}`]: 'owned',
        'aws:RequestTag/karpenter.sh/managed-by': `${eksClusterName}`,
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
        [`aws:ResourceTag/kubernetes.io/cluster/${eksClusterName}`]: 'owned',
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
    resources: [`arn:aws:eks:${Stack.of(scope).region}:${Stack.of(scope).account}:cluster/${eksClusterName}`],
    actions: ['eks:DescribeCluster'],
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
          clusterName: eksClusterName,
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

  Tags.of(karpenterInstancesSg).add('karpenter.sh/discovery', `${eksClusterName}`);

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
    'karpenter.sh/discovery', eksClusterName,
  );

  cluster.vpc.privateSubnets.forEach((subnet) => {
    Tags.of(subnet).add('karpenter.sh/discovery', eksClusterName);
  });

  cluster.vpc.publicSubnets.forEach((subnet) =>
    Tags.of(subnet).add('karpenter.sh/discovery', eksClusterName),
  );

  const privateSubnets = cluster.vpc.selectSubnets({
    onePerAz: true,
    subnetType: SubnetType.PRIVATE_WITH_EGRESS,
  }).subnets;

  let listPrivateSubnets: string[] = privateSubnets.map(subnet => subnet.subnetId);

  let manifest = Utils.readYamlDocument(`${__dirname}/resources/k8s/karpenter-provisioner-config/${karpenterVersion}/tooling-provisioner.yml`);

  manifest = manifest.replace(/(\{{cluster-name}})/g, eksClusterName);
  manifest = manifest.replace(/(\{{subnet-list}})/g, listPrivateSubnets.join(','));

  let manfifestYAML: any = manifest.split('---').map((e: any) => Utils.loadYaml(e));

  const manifestApply = cluster.addManifest('provisioner-tooling', ...manfifestYAML);

  manifestApply.node.addDependency(karpenterChart);

  return karpenterChart;
}

/**
 * @internal
 * Create a namespace with a predefined baseline
 *  * Create namespace
 *  * Define a Network Policy
 */
export function createNamespace (cluster: Cluster, namespace: string): KubernetesManifest {

  const regex = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;

  const reg = RegExp(regex);

  if (!reg.exec(namespace) || namespace.length > 63) {
    throw new Error(`Namespace provided violates the constraints of Namespace naming ${namespace}`);
  }

  //Create namespace with pod security admission to with pod security standard to baseline
  //To learn more look at https://kubernetes.io/docs/concepts/security/pod-security-standards/
  let ns = cluster.addManifest(`${namespace}-Namespace`, {
    apiVersion: 'v1',
    kind: 'Namespace',
    metadata: {
      name: namespace,
      labels: {
        'pod-security.kubernetes.io/enforce': 'baseline',
        'pod-security.kubernetes.io/enforce-version': 'v1.28',
      },
    },

  });

  //Create network policy for namespace
  let manifestNetworkPolicy = Utils.readYamlDocument(`${__dirname}/resources/k8s/network-policy-pod2pod-internet.yml`);

  manifestNetworkPolicy = manifestNetworkPolicy.replace(/(\{{NAMESPACE}})/g, namespace);

  let manifestNetworkPolicyManifestYAML: any = manifestNetworkPolicy.split('---').map((e: any) => Utils.loadYaml(e));

  const manifestApplyNetworkPolicy = cluster.addManifest(`${namespace}-network-policy`, ...manifestNetworkPolicyManifestYAML);

  manifestApplyNetworkPolicy.node.addDependency(ns);


  //Create resource quota and limit range for namespace
  let manifestResourceManagement = Utils.readYamlDocument(`${__dirname}/resources/k8s/resource-management.yaml`);

  manifestResourceManagement = manifestResourceManagement.replace(/(\{{NAMESPACE}})/g, namespace);

  let manifestResourceManagementYAML: any = manifestResourceManagement.split('---').map((e: any) => Utils.loadYaml(e));

  const manifestApplResourceManagement = cluster.addManifest(`${namespace}-resource-management`, ...manifestResourceManagementYAML);

  manifestApplResourceManagement.node.addDependency(ns);

  return ns;
}
