// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The list of supported Karpenter versions as defined [here](https://github.com/aws/karpenter/releases)
 * At this time only v0.32.1 is supported.
 */
export enum KarpenterVersion {
  V0_32_1 = 'v0.32.1',
}

export const DEFAULT_KARPENTER_VERSION: KarpenterVersion = KarpenterVersion.V0_32_1;
