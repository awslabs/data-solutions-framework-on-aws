// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { CustomResource } from 'aws-cdk-lib';

/**
 * Redshift new data share details
 */
export interface RedshiftNewShareProps {
  /**
     * The database name where the share belongs to
     */
  readonly databaseName: string;

  /**
     * The name of the data share
     */
  readonly dataShareName: string;

  /**
     * The namespace ID of the producer
     */
  readonly producerNamespace: string;

  /**
     * The ARN of the data share
     */
  readonly dataShareArn: string;

  /**
     * The ARN of the producer
     */
  readonly producerArn: string;

  /**
     * The custom resource related to the management of the data share
     */
  readonly newShareCustomResource: CustomResource;
}