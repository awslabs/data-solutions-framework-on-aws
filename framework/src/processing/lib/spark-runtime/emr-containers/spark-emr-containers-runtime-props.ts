// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


import { RemovalPolicy } from 'aws-cdk-lib';
import { IVpc } from 'aws-cdk-lib/aws-ec2';
import {
  Cluster,
  KubernetesVersion,
} from 'aws-cdk-lib/aws-eks';
import { IRole } from 'aws-cdk-lib/aws-iam';
import { ILayerVersion } from 'aws-cdk-lib/aws-lambda';
import { KarpenterVersion } from '../../karpenter-releases';

/**
 * The properties for the EmrEksCluster Construct class.
 */
export interface SparkEmrContainersRuntimeProps {
  /**
   * Name of the Amazon EKS cluster to be created
   * @default -  The [default cluster name]{@link DEFAULT_CLUSTER_NAME}
   */
  readonly eksClusterName?: string;
  /**
   * Amazon IAM Role to be added to Amazon EKS master roles that will give access to kubernetes cluster from AWS console UI.
   * An admin role must be passed if `eksCluster` property is not set.
   * You will use this role to manage the EKS cluster and grant other access to it.
   */
  readonly eksAdminRole?: IRole;
  /**
   * The EKS cluster to setup EMR on. The cluster needs to be created in the same CDK Stack.
   * If the EKS cluster is provided, the cluster AddOns and all the controllers (Ingress controller, Cluster Autoscaler or Karpenter...) need to be configured.
   * When providing an EKS cluster, the methods for adding nodegroups can still be used. They implement the best practices for running Spark on EKS.
   * @default - An EKS Cluster is created
   */
  readonly eksCluster?: Cluster;
  /**
   * Kubernetes version for Amazon EKS cluster that will be created
   * The default is changed as new version version of k8s on EKS becomes available
   * @default -  Kubernetes version {@link DEFAULT_EKS_VERSION}
   */
  readonly kubernetesVersion?: KubernetesVersion;
  /**
   * If set to true, the Construct will create default EKS nodegroups or node provisioners (based on the autoscaler mechanism used).
   * There are three types of nodes:
   *  * Nodes for critical jobs which use on-demand instances, high speed disks and workload isolation
   *  * Nodes for shared worklaods which uses spot instances and no isolation to optimize costs
   *  * Nodes for notebooks which leverage a cost optimized configuration for running EMR managed endpoints and spark drivers/executors.
   * @default -  true
   */
  readonly defaultNodes?: boolean;
  /**
   * The version of karpenter to pass to Helm
   * @default - The [default Karpenter version]{@link DEFAULT_KARPENTER_VERSION}
   */
  readonly karpenterVersion?: KarpenterVersion;
  /**
   * Starting k8s 1.22, CDK no longer bundle the kubectl layer with the code due to breaking npm package size.
   * A layer needs to be passed to the Construct.
   *
   * The cdk [documentation](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_eks.KubernetesVersion.html#static-v1_22)
   * contains the libraries that you should add for the right Kubernetes version
   */
  readonly kubectlLambdaLayer: ILayerVersion;

  /**
   * The CIDR of the VPC to use with EKS. If provided, a VPC with three public subnets and three private subnets is created
   * The size of the private subnets is four time the one of the public subnet
   * @default - A vpc with the following CIDR 10.0.0.0/16 will be used
   */
  readonly vpcCidr?: string;

  /**
   * The VPC object where to deploy the EKS cluster
   * VPC should have at least two private and public subnets in different Availability Zones
   * All private subnets should have the following tags:
   * 'for-use-with-amazon-emr-managed-policies'='true'
   * 'kubernetes.io/role/internal-elb'='1'
   * All public subnets should have the following tag:
   * 'kubernetes.io/role/elb'='1'
   * Cannot be combined with `vpcCidr`. If combined, `vpcCidr` takes precedence.
   */
  readonly eksVpc?: IVpc;

  /**
  * The CIDR blocks that are allowed access to your cluster’s public Kubernetes API server endpoint.
  */
  readonly publicAccessCIDRs: string[];

  /**
  * Wether we need to create an EMR on EKS Service Linked Role
  * @default - true
  */
  readonly createEmrOnEksServiceLinkedRole?: boolean;

  /**
   * The removal policy when deleting the CDK resource.
   * Resources like Amazon cloudwatch log or Amazon S3 bucket
   * If DESTROY is selected, context value
   * @default - The resources are not deleted (`RemovalPolicy.RETAIN`).
   */
  readonly removalPolicy?: RemovalPolicy;
}