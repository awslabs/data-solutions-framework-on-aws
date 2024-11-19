// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Enum defining the EMR version as defined in the [Amazon EMR documentation](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-release-components.html)
 */

export enum EmrRuntimeVersion {
  V7_3= 'emr-7.3.0',
  V7_2= 'emr-7.2.0',
  V7_1= 'emr-7.1.0',
  V7_0 = 'emr-7.0.0',
  V6_15 = 'emr-6.15.0',
  V6_14 = 'emr-6.14.0',
  V6_13 = 'emr-6.13.0',
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
}

export enum EmrContainersRuntimeVersion {
  V7_3 = 'emr-7.3.0-latest',
  V7_2 = 'emr-7.2.0-latest',
  V7_1 = 'emr-7.1.0-latest',
  V7_0 = 'emr-7.0.0-latest',
  V6_15 = 'emr-6.15.0-latest',
  V6_14 = 'emr-6.14.0-latest',
  V6_13 = 'emr-6.13.0-latest',
  V6_12 = 'emr-6.12.0-latest',
  V6_11_1 = 'emr-6.11.1-latest',
  V6_11 = 'emr-6.11.0-latest',
  V6_10_1 = 'emr-6.10.1-latest',
  V6_10 = 'emr-6.10.0-latest',
  V6_9 = 'emr-6.9.0-latest',
  V6_8 = 'emr-6.8.0-latest',
  V6_7 = 'emr-6.7.0-latest',
  V6_6 = 'emr-6.6.0-latest',
  V6_5 = 'emr-6.5.0-latest',
  V6_4 = 'emr-6.4.0-latest',
  V6_3 = 'emr-6.3.0-latest',
  V6_2 = 'emr-6.2.0-latest',
  V5_33 = 'emr-5.33.0-latest',
  V5_32 = 'emr-5.32.0-latest',
}

const EMR_EKS_IMAGE_URL = 'public.ecr.aws/emr-on-eks/spark/';

/**
 * The list of supported Spark images to use in the SparkCICDPipeline.
 */
export enum SparkImage {
  EMR_7_3 = EMR_EKS_IMAGE_URL + EmrRuntimeVersion.V7_3 + ':latest',
  EMR_7_2 = EMR_EKS_IMAGE_URL + EmrRuntimeVersion.V7_2 + ':latest',
  EMR_7_1 = EMR_EKS_IMAGE_URL + EmrRuntimeVersion.V7_1 + ':latest',
  EMR_7_0 = EMR_EKS_IMAGE_URL + EmrRuntimeVersion.V7_0 + ':latest',
  EMR_6_15 = EMR_EKS_IMAGE_URL + EmrRuntimeVersion.V6_15 + ':latest',
  EMR_6_14 = EMR_EKS_IMAGE_URL + EmrRuntimeVersion.V6_14 + ':latest',
  EMR_6_13 = EMR_EKS_IMAGE_URL + EmrRuntimeVersion.V6_13 + ':latest',
  EMR_6_12 = EMR_EKS_IMAGE_URL + EmrRuntimeVersion.V6_12 + ':latest',
  EMR_6_11 = EMR_EKS_IMAGE_URL + EmrRuntimeVersion.V6_11 + ':latest',
  EMR_6_10 = EMR_EKS_IMAGE_URL + EmrRuntimeVersion.V6_10 + ':latest',
  EMR_6_9 = EMR_EKS_IMAGE_URL + EmrRuntimeVersion.V6_9 + ':latest',
}

export const EMR_DEFAULT_VERSION: EmrRuntimeVersion = EmrRuntimeVersion.V7_3;
export const EMR_CONTAINERS_DEFAULT_VERSION: EmrContainersRuntimeVersion = EmrContainersRuntimeVersion.V7_3;

/**
 * The default Spark image to run the unit tests
 */
export const DEFAULT_SPARK_IMAGE: SparkImage = SparkImage.EMR_6_15;