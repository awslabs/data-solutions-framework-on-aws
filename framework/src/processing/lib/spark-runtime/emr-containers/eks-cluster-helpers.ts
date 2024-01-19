// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Duration } from 'aws-cdk-lib';
import { CfnLaunchTemplate, InstanceType } from 'aws-cdk-lib/aws-ec2';
import { Cluster, KubernetesManifest, CfnAddon, NodegroupOptions, NodegroupAmiType, KubernetesVersion, ICluster } from 'aws-cdk-lib/aws-eks';
import { FederatedPrincipal, IRole, ManagedPolicy, Policy, PolicyDocument, Role } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { CERTMANAGER_HELM_CHART_VERSION, EBS_CSI_DRIVER_ADDON_VERSION } from './eks-controllers-version';
import * as IamPolicyEbsCsiDriver from './resources/k8s/controllers-iam-policies/iam-policy-ebs-csi-driver.json';
import { Utils } from '../../../../utils';


/**
 * @internal
 * Configure the EBS CSI driver on an Amazon EKS cluster
 * @param {Construct} scope the CDK scope to create resources in
 * @param {ICluster} cluster the EKS cluster to install the CSI driver in
 * @param {KubernetesVersion} eksClusterK8sVersion the Kubernetes version of the EKS cluster
 * @return {IRole} the IAM role used by the CSI driver
 */
export function ebsCsiDriverSetup(scope: Construct, cluster: ICluster, eksClusterK8sVersion: KubernetesVersion): IRole {

  const ebsCsiDriverIrsa = cluster.addServiceAccount('EbsCsiDriverSa', {
    name: 'ebs-csi-controller-sa',
    namespace: 'kube-system',
  });

  const ebsCsiDriverPolicyDocument = PolicyDocument.fromJson(IamPolicyEbsCsiDriver);

  const ebsCsiDriverPolicy = new Policy(
    scope,
    'EbsCsiDriverPolicy',
    { document: ebsCsiDriverPolicyDocument },
  );

  ebsCsiDriverPolicy.attachToRole(ebsCsiDriverIrsa.role);

  const ebsCSIDriver = new CfnAddon(scope, 'EbsCsiDriver', {
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

  return ebsCsiDriverIrsa.role;
}

/**
 * @internal
 * Configure the IAM role used by the aws-node pod following AWS best practice not to use the EC2 instance role
 * @param {Construct} scope the CDK scope to create resources in
 * @param {ICluster} cluster the EKS cluster to configure the aws-node pod in
 * @return {IRole} the IAM role used by the aws-node pod
 */

export function awsNodeRoleSetup(scope: Construct, cluster: ICluster): IRole {

  const awsNodeRole: Role = new Role(scope, 'AwsNodeRole', {
    assumedBy: new FederatedPrincipal(
      cluster.openIdConnectProvider.openIdConnectProviderArn,
      { ...[] },
      'sts:AssumeRoleWithWebIdentity',
    ),
    description: `awsNodeRole-${cluster.clusterName}`,
    managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('AmazonEKS_CNI_Policy')],
  });

  // update the aws-node service account with IAM role created for it
  new KubernetesManifest(scope, 'AwsNodeSaUpdateManifest', {
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

  return awsNodeRole;
}

/**
 * @internal
 * Method to setup a managed nodegroup to bootstrap all cluster vital componenets like
 * core dns, karpenter, ebs csi driver.
 * @param {Construct} scope the CDK scope to create the nodegroup in
 * @param {Cluster} cluster the EKS cluster to create the nodegroup in
 * @param {IRole} nodeRole the IAM role to use for the nodegroup
 */
export function toolingManagedNodegroupSetup (scope: Construct, cluster: Cluster, nodeRole: IRole) {

  const toolingLaunchTemplate: CfnLaunchTemplate = new CfnLaunchTemplate(scope, 'toolinglaunchtemplate', {
    launchTemplateName: `ToolingNodegroup-${Utils.generateUniqueHash(scope, 'toolinglaunchtemplate')}`,

    launchTemplateData: {

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
 * Create a namespace with a predefined baseline
 *  * Create namespace
 *  * Define a Network Policy
 * @param {ICluster} cluster the EKS cluster to create the namespace in
 * @param {string} namespace the namespace to create
 * @return {KubernetesManifest} the Kubernetes manifest for the namespace
 */
export function createNamespace (cluster: ICluster, namespace: string): KubernetesManifest {

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

