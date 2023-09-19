// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Duration, Fn, Tags } from 'aws-cdk-lib';
import { CfnLaunchTemplate, ISubnet, InstanceType, Port, SecurityGroup, SubnetType } from 'aws-cdk-lib/aws-ec2';
import { Cluster, HelmChart, KubernetesManifest, CfnAddon, NodegroupOptions, NodegroupAmiType} from 'aws-cdk-lib/aws-eks';
import { Rule } from 'aws-cdk-lib/aws-events';
import { SqsQueue } from 'aws-cdk-lib/aws-events-targets';
import { CfnInstanceProfile, Effect, FederatedPrincipal, ManagedPolicy, Policy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import { EmrEksCluster } from './emr-eks-cluster';
import * as IamPolicyAlb from './resources/k8s/iam-policy-alb.json';
import * as IamPolicyEbsCsiDriver from './resources/k8s/iam-policy-ebs-csi-driver.json';
import { Utils } from '../../utils';


/**
 * @internal
 * Upload podTemplates to the Amazon S3 location used by the cluster.
 * @param {Cluster} cluster the unique ID of the CDK resource
 * @param {Construct} scope The local path of the yaml podTemplate files to upload
 * @param {string} eksAdminRoleArn The admin role of the EKS cluster
 */
export function eksClusterSetup(cluster: EmrEksCluster, scope: Construct, eksAdminRoleArn: string, nodeRole: Role) {

  // Add the provided Amazon IAM Role as Amazon EKS Admin
  cluster.eksCluster.awsAuth.addMastersRole(Role.fromRoleArn( scope, 'AdminRole', eksAdminRoleArn ), 'AdminRole');
  
  const ebsCsiDriverIrsa = cluster.eksCluster.addServiceAccount ('ebsCSIDriverRoleSA', {
    name: 'ebs-csi-controller-sa',
    namespace: 'kube-system',
  });

  const ebsCsiDriverPolicyDocument = PolicyDocument.fromJson(IamPolicyEbsCsiDriver);

  const ebsCsiDriverPolicy = new Policy(
    scope,
    'IamPolicyEbsCsiDriverIAMPolicy',
    { document: ebsCsiDriverPolicyDocument },
  );

  ebsCsiDriverPolicy.attachToRole (ebsCsiDriverIrsa.role);

  const ebsCSIDriver = new CfnAddon(scope, 'ebsCsiDriver', {
    addonName: 'aws-ebs-csi-driver',
    clusterName: cluster.eksCluster.clusterName,
    serviceAccountRoleArn: ebsCsiDriverIrsa.role.roleArn,
    addonVersion: 'v1.18.0-eksbuild.1',
    resolveConflicts: 'OVERWRITE',
  });

  ebsCSIDriver.node.addDependency(ebsCsiDriverIrsa);

  // Deploy the Helm Chart for the Certificate Manager. Required for EMR Studio ALB.
  const certManager = cluster.eksCluster.addHelmChart('CertManager', {
    createNamespace: true,
    namespace: 'cert-manager',
    chart: 'cert-manager',
    repository: 'https://charts.jetstack.io',
    version: '1.11.2',
    timeout: Duration.minutes(14),
    values: {
      startupapicheck: {
        timeout: '5m',
      },
      installCRDs: true,
    },
  });

  //Create service account for ALB and install ALB
  const albPolicyDocument = PolicyDocument.fromJson(IamPolicyAlb);
  const albIAMPolicy = new Policy(
    scope,
    'AWSLoadBalancerControllerIAMPolicy',
    { document: albPolicyDocument },
  );

  const albServiceAccount = cluster.eksCluster.addServiceAccount('ALB', {
    name: 'aws-load-balancer-controller',
    namespace: 'kube-system',
  });
  albIAMPolicy.attachToRole(albServiceAccount.role);

  const albService = cluster.eksCluster.addHelmChart('ALB', {
    chart: 'aws-load-balancer-controller',
    repository: 'https://aws.github.io/eks-charts',
    namespace: 'kube-system',
    version: '1.5.2',
    timeout: Duration.minutes(14),
    values: {
      clusterName: cluster.clusterName,
      serviceAccount: {
        name: 'aws-load-balancer-controller',
        create: false,
      },
    },
  });
  
  albService.node.addDependency(albServiceAccount);
  albService.node.addDependency(certManager);

  // Nodegroup capacity needed for all the tooling components including Karpenter
  toolingManagedNodegroupSetup(scope, cluster, nodeRole);


  //IAM role created for the aws-node pod following AWS best practice not to use the EC2 instance role
  const awsNodeRole: Role = new Role(scope, 'awsNodeRole', {
    assumedBy: new FederatedPrincipal(
      cluster.eksCluster.openIdConnectProvider.openIdConnectProviderArn,
      { ...[] },
      'sts:AssumeRoleWithWebIdentity',
    ),
    roleName: `awsNodeRole-${cluster.clusterName}`,
    managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('AmazonEKS_CNI_Policy')],
  });

  // update the aws-node service account with IAM role created for it
  new KubernetesManifest(scope, 'awsNodeServiceAccountUpdateManifest', {
    cluster: cluster.eksCluster,
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

function toolingManagedNodegroupSetup (scope: Construct, cluster: EmrEksCluster, nodeRole: Role) {

  // Add headers and footers to user data and install SSM agent
  const userData = `MIME-Version: 1.0
Content-Type: multipart/mixed; boundary="==MYBOUNDARY=="

--==MYBOUNDARY==
Content-Type: text/x-shellscript; charset="us-ascii"

#!/bin/bash
yum install -y https://s3.amazonaws.com/ec2-downloads-windows/SSMAgent/latest/linux_amd64/amazon-ssm-agent.rpm
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent

--==MYBOUNDARY==--\\
`;

  const toolingLaunchTemplate: CfnLaunchTemplate = new CfnLaunchTemplate(scope, 'toolinglaunchtemplate', {
    launchTemplateName: 'ToolingNodegroup',

    launchTemplateData: {
      userData: Fn.base64(userData),
      metadataOptions: {
        httpEndpoint: 'enabled',
        httpProtocolIpv6: 'disabled',
        httpPutResponseHopLimit: 2,
        httpTokens: 'required',
      }
    },
  });

  let toolingManagedNodegroupOptions: NodegroupOptions = {
    nodegroupName: 'tooling',
    instanceTypes: [new InstanceType('t3.medium')],
    amiType: NodegroupAmiType.AL2_X86_64,
    minSize: 2,
    maxSize: 2,
    labels: { role: 'tooling' },
    launchTemplateSpec: {
      id: toolingLaunchTemplate.ref,
      version: toolingLaunchTemplate.attrLatestVersionNumber,
    },
    nodeRole: nodeRole
  };


  cluster.eksCluster.addNodegroupCapacity('toolingMNG', toolingManagedNodegroupOptions);
}

/**
 * @internal
 * Method to add the default Karpenter provisioners for Spark workloads
 */
export function setDefaultKarpenterProvisioners(cluster: EmrEksCluster) {
  const subnets = cluster.eksCluster.vpc.selectSubnets({
    onePerAz: true,
    subnetType: SubnetType.PRIVATE_WITH_EGRESS,
  }).subnets;

  subnets.forEach( (subnet, index) => {
    let criticalManfifestYAML = karpenterManifestSetup(cluster.clusterName, `${__dirname}/resources/k8s/karpenter-provisioner-config/critical-provisioner.yml`, subnet);
    cluster.addKarpenterProvisioner(`karpenterCriticalManifest-${index}`, criticalManfifestYAML);

    let sharedDriverManfifestYAML = karpenterManifestSetup(cluster.clusterName, `${__dirname}/resources/k8s/karpenter-provisioner-config/shared-driver-provisioner.yml`, subnet);
    cluster.addKarpenterProvisioner(`karpenterSharedDriverManifest-${index}`, sharedDriverManfifestYAML);

    let sharedExecutorManfifestYAML = karpenterManifestSetup(cluster.clusterName, `${__dirname}/resources/k8s/karpenter-provisioner-config/shared-executor-provisioner.yml`, subnet);
    cluster.addKarpenterProvisioner(`karpenterSharedExecutorManifest-${index}`, sharedExecutorManfifestYAML);

    let notebookDriverManfifestYAML = karpenterManifestSetup(cluster.clusterName, `${__dirname}/resources/k8s/karpenter-provisioner-config/notebook-driver-provisioner.yml`, subnet);
    cluster.addKarpenterProvisioner(`karpenterNotebookDriverManifest-${index}`, notebookDriverManfifestYAML);

    let notebookExecutorManfifestYAML = karpenterManifestSetup(cluster.clusterName, `${__dirname}/resources/k8s/karpenter-provisioner-config/notebook-executor-provisioner.yml`, subnet);
    cluster.addKarpenterProvisioner(`karpenterNotebookExecutorManifest-${index}`, notebookExecutorManfifestYAML);
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
  karpenterVersion?: string
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
      'ec2:CreateLaunchTemplate',
      'ec2:DeleteLaunchTemplate',
      'ec2:CreateFleet',
      'ec2:RunInstances',
      'ec2:CreateTags',
      'ec2:TerminateInstances',
      'ec2:DescribeLaunchTemplates',
      'ec2:DescribeInstances',
      'ec2:DescribeSecurityGroups',
      'ec2:DescribeSubnets',
      'ec2:DescribeInstanceTypes',
      'ec2:DescribeInstanceTypeOfferings',
      'ec2:DescribeAvailabilityZones',
    ],
    resources: ['*'],
  });

  const karpenterControllerPolicyStatementIAM: PolicyStatement = new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['iam:PassRole'],
    resources: [`${nodeRole.roleArn}`],
  });

  const karpenterNS = cluster.addManifest('karpenterNS', {
    apiVersion: 'v1',
    kind: 'Namespace',
    metadata: { name: 'karpenter' },
  });

  const karpenterAccount = cluster.addServiceAccount('Karpenter', {
    name: 'karpenter',
    namespace: 'karpenter',
  });

  karpenterAccount.node.addDependency(karpenterNS);

  karpenterAccount.addToPrincipalPolicy(karpenterControllerPolicyStatementSSM);
  karpenterAccount.addToPrincipalPolicy(karpenterControllerPolicyStatementEC2);
  karpenterAccount.addToPrincipalPolicy(karpenterControllerPolicyStatementIAM);

  //Deploy Karpenter Chart
  const karpenterChart = cluster.addHelmChart('Karpenter', {
    chart: 'karpenter',
    release: 'karpenter',
    repository: 'oci://public.ecr.aws/karpenter/karpenter',
    namespace: 'karpenter',
    version: karpenterVersion || EmrEksCluster.DEFAULT_KARPENTER_VERSION,
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

  let manifest = Utils.readYamlDocument(`${__dirname}/resources/k8s/karpenter-provisioner-config/tooling-provisioner.yml`);

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

  const regex = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;;

  if (!namespace.match(regex) || namespace.length > 63) {
      throw new Error(`Namespace provided violates the constraints of Namespace naming ${namespace}`);
  }

  
  let ns = cluster.addManifest(`${namespace}-Namespace`, {
    apiVersion: 'v1',
    kind: 'Namespace',
    metadata: { 
      name:  namespace,
      labels: {
        'pod-security.kubernetes.io/enforce': 'baseline',
        'pod-security.kubernetes.io/enforce-version': 'v1.28'
      }
    },
    
  });

  let manifest = Utils.readYamlDocument(`${__dirname}/resources/k8s/network-policy-pod2pod-internet.yml`);

  manifest = manifest.replace(/(\{{NAMESPACE}})/g, namespace);

  let manfifestYAML: any = manifest.split('---').map((e: any) => Utils.loadYaml(e));

  const manifestApply = cluster.addManifest(`${namespace}-network-policy`, ...manfifestYAML);

  manifestApply.node.addDependency(ns)

  return ns;
}
