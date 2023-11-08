// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { KubernetesVersion } from 'aws-cdk-lib/aws-eks';

//TODO put the right version here
export const EBS_CSI_DRIVER_ADDON_VERSION: Map<KubernetesVersion, string> = new Map([
  [KubernetesVersion.V1_24, 'v1.18.0-eksbuild.1'],
  [KubernetesVersion.V1_25, 'v1.18.0-eksbuild.1'],
  [KubernetesVersion.V1_26, 'v1.18.0-eksbuild.1'],
  [KubernetesVersion.V1_27, 'v1.18.0-eksbuild.1'],
]);


export const CERTMANAGER_HELM_CHART_VERSION: Map<KubernetesVersion, string> = new Map([
  [KubernetesVersion.V1_24, '1.11.2'],
  [KubernetesVersion.V1_25, '1.11.2'],
  [KubernetesVersion.V1_26, '1.11.2'],
  [KubernetesVersion.V1_27, '1.11.2'],
]);