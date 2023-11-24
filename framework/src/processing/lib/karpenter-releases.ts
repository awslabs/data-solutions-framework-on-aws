// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * Enum defining the Karpenter versions as defined [here](https://github.com/aws/karpenter/releases)
 */
export enum KarpenterVersion {
  V0_32_1 = 'v0.32.1',
}

export const DEFAULT_KARPENTER_VERSION: KarpenterVersion = KarpenterVersion.V0_32_1;
