// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { RedshiftData } from '../redshift-data';
import { RedshiftDataProps } from '../redshift-data-props';

/**
 * Properties for the `RedshiftDataSharing` construct
 */
export interface RedshiftDataSharingProps extends RedshiftDataProps {

  /**
   * Instance of `RedshiftData` construct
   */
  readonly redshiftData: RedshiftData;
}