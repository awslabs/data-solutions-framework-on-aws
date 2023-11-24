// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { KubernetesVersion } from 'aws-cdk-lib/aws-eks';

/**
 * @internal
 * The version mapping can be taken from here
 * aws eks describe-addon-versions --addon-name aws-ebs-csi-driver
 */
export const EBS_CSI_DRIVER_ADDON_VERSION: Map<KubernetesVersion, string> = new Map([
  [KubernetesVersion.V1_24, 'v1.24.1-eksbuild.1'],
  [KubernetesVersion.V1_25, 'v1.24.1-eksbuild.1'],
  [KubernetesVersion.V1_26, 'v1.24.1-eksbuild.1'],
  [KubernetesVersion.V1_27, 'v1.24.1-eksbuild.1'],
]);

/**
 * @internal
 * The version mapping can be taken from here
 * https://cert-manager.io/docs/releases/
 */
export const CERTMANAGER_HELM_CHART_VERSION: Map<KubernetesVersion, string> = new Map([
  [KubernetesVersion.V1_24, '1.13.2'],
  [KubernetesVersion.V1_25, '1.13.2'],
  [KubernetesVersion.V1_26, '1.13.2'],
  [KubernetesVersion.V1_27, '1.13.2'],
]);