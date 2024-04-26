// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { BaseRedshiftDataSharingAccessProps } from './base-redshift-data-sharing-access-props';

/**
 * Properties for data sharing grants
 */
export interface RedshiftDataSharingGrantProps extends BaseRedshiftDataSharingAccessProps {
  /**
   * If set to `true`, cross-account grants would automatically be authorized.
   * See https://docs.aws.amazon.com/redshift/latest/dg/consumer-account-admin.html
   * @default - cross-account grants should be authorized manually
   */
  readonly autoAuthorized?: boolean;
}