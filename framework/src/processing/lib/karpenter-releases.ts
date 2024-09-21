// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The list of supported Karpenter versions as defined [here](https://github.com/aws/karpenter/releases)
 * At this time only v0.37.0 is supported.
 */
export enum KarpenterVersion {
  V1_0_1 = '1.0.1',
}

export const DEFAULT_KARPENTER_VERSION: KarpenterVersion = KarpenterVersion.V1_0_1;
