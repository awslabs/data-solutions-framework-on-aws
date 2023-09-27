// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { KubernetesVersion } from "aws-cdk-lib/aws-eks";


//TODO put the right version here
export const ALB_CONTROLLER_VERSION: Map<KubernetesVersion, string> = new Map([
    [KubernetesVersion.V1_25, "9.25.0"],
    [KubernetesVersion.V1_25, "9.25.0"],
    [KubernetesVersion.V1_25, "9.25.0"],
    [KubernetesVersion.V1_24, "9.25.0"]
]);

//TODO put the right version here
export const EBS_CSI_DRIVER: Map<KubernetesVersion, string> = new Map([
    [KubernetesVersion.V1_25, "9.25.0"],
    [KubernetesVersion.V1_25, "9.25.0"],
    [KubernetesVersion.V1_25, "9.25.0"],
    [KubernetesVersion.V1_24, "9.25.0"]
]);
