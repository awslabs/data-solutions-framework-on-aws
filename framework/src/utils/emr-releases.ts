// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * Enum defining the EMR version as defined [here](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-release-6x.html)
 */

export enum EmrRuntimeVersion {
  V6_12 = 'emr-6.12.0',
  V6_11_1 = 'emr-6.11.1',
  V6_11 = 'emr-6.11.0',
  V6_10_1 = 'emr-6.10.1',
  V6_10 = 'emr-6.10.0',
  V6_9 = 'emr-6.9.0',
  V6_8 = 'emr-6.8.0',
  V6_7 = 'emr-6.7.0',
  V6_6 = 'emr-6.6.0',
  V6_5 = 'emr-6.5.0',
  V6_4 = 'emr-6.4.0',
  V6_3 = 'emr-6.3.0',
  V6_2 = 'emr-6.2.0',
  V5_33 = 'emr-5.33.0',
  V5_32 = 'emr-5.32.0',
};

export const EMR_DEFAULT_VERSION: EmrRuntimeVersion = EmrRuntimeVersion.V6_12;