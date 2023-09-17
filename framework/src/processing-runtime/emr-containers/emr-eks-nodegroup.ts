// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { InstanceType,  ISubnet } from 'aws-cdk-lib/aws-ec2';
import { NodegroupOptions, TaintEffect, CapacityType, NodegroupAmiType } from 'aws-cdk-lib/aws-eks';

/**
 * The Options for adding EmrEksNodegroup to an EmrEksCluster. Some of the Amazon EKS Nodegroup parameters are overriden:
 * -  NodegroupName by the id and an index per AZ
 * -  LaunchTemplate spec
 * -  SubnetList by either the subnet parameter or one subnet per Amazon EKS Cluster AZ.
 * -  Labels and Taints are automatically used to tag the nodegroup for the cluster autoscaler
 */

export interface EmrEksNodegroupOptions extends NodegroupOptions {
  /**
   * Set to true if using instance types with local NVMe drives to mount them automatically at boot time
   * @default false
   */
  readonly mountNvme?: boolean;
  /**
   * Configure the Amazon EKS NodeGroup in this subnet. Use this setting for resource dependencies like an Amazon RDS database.
   * The subnet must include the availability zone information because the nodegroup is tagged with the AZ for the K8S Cluster Autoscaler.
   * @default - One NodeGroup is deployed per cluster AZ
   */
  readonly subnet?: ISubnet;
}

/**
 * @summary EmrEksNodegroup containing the default Nodegroups
 */
export class EmrEksNodegroup {

  /*
   ** Default nodegroup configuration for Kubernetes applications required by EMR on EKS (e.g cert manager and cluster autoscaler)
   */
  public static readonly TOOLING_ALL: EmrEksNodegroupOptions = {
    nodegroupName: 'tooling',
    instanceTypes: [new InstanceType('t3.medium')],
    amiType: NodegroupAmiType.AL2_X86_64,
    minSize: 2,
    maxSize: 10,
    labels: { role: 'tooling' },
  };

}
