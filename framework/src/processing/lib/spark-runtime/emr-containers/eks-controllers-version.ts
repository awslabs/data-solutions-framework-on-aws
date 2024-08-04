// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

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
  [KubernetesVersion.V1_28, 'v1.24.1-eksbuild.1'],
  [KubernetesVersion.V1_29, 'v1.33.0-eksbuild.1'],
  [KubernetesVersion.V1_30, 'v1.33.0-eksbuild.1'],
]);


// TODO update this with new LTS before May 2025
/**
 * @internal
 * The version mapping can be taken from here
 * Using 1.12.12 as its LTS until May 19, 2025
 * https://cert-manager.io/docs/releases/
 */
export const CERTMANAGER_HELM_CHART_VERSION: Map<KubernetesVersion, string> = new Map([
  [KubernetesVersion.V1_24, '1.12.12'],
  [KubernetesVersion.V1_25, '1.12.12'],
  [KubernetesVersion.V1_26, '1.12.12'],
  [KubernetesVersion.V1_27, '1.12.12'],
  [KubernetesVersion.V1_28, '1.12.12'],
  [KubernetesVersion.V1_29, '1.12.12'],
  [KubernetesVersion.V1_30, '1.12.12'],
]);