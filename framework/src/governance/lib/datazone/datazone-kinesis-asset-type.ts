// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { RemovalPolicy } from 'aws-cdk-lib';
import { CfnProject } from 'aws-cdk-lib/aws-datazone';
import { Construct } from 'constructs';
import { CustomAssetType, DataZoneCustomAssetTypeFactory } from './datazone-custom-asset-type-factory';
import { DataZoneKinesisAssetTypeProps } from './datazone-kinesis-asset-type-props';
import { Context, TrackedConstruct, TrackedConstructProps } from '../../../utils';

/**
 * A DataZone custom asset type representing a Kinesis Stream.
 *
 * @example
 * new dsf.governance.DataZoneKinesisAssetType(this, 'KinesisAssetType', {
 *   domainId: 'aba_dc999t9ime9sss',
 *   projectId: '999999b3m5cpz',
 * });
 */
export class DataZoneKinesisAssetType extends TrackedConstruct {
  /**
   * The custom asset type for Kinesis
   */
  readonly kinesisCustomAssetType: CustomAssetType;

  readonly owningProjectId?: CfnProject;

  private readonly removalPolicy: RemovalPolicy;

  constructor(scope: Construct, id: string, props: DataZoneKinesisAssetTypeProps) {
    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: DataZoneKinesisAssetType.name,
    };

    super(scope, id, trackedConstructProps);
    this.removalPolicy = Context.revertRemovalPolicy(this, props.removalPolicy);

    const dzCustomAssetTypeFactory: DataZoneCustomAssetTypeFactory = props.dzCustomAssetTypeFactory || new DataZoneCustomAssetTypeFactory(this, 'DZCustomAssetTypeHandler', {
      domainId: props.domainId,
      removalPolicy: this.removalPolicy,
    });

    if (props.projectId === undefined) {
      this.owningProjectId = new CfnProject(this, 'KinesisAssetTypeProjectOwner', {
        name: 'KinesisGovernance',
        domainIdentifier: props.domainId,
      });
    }

    this.kinesisCustomAssetType = dzCustomAssetTypeFactory.createCustomAssetType('KinesisCustomAssetType', {
      assetTypeName: 'KinesisStreamAssetType',
      assetTypeDescription: 'Custom asset type to support Kinesis Stream asset',
      projectId: props.projectId || this.owningProjectId!.attrId,
      formTypes: [
        {
          name: 'amazon.datazone.RelationalTableFormType',
          required: true,
        },
        {
          name: 'KinesisSourceReferenceFormType',
          model: [
            {
              name: 'stream_arn',
              type: 'String',
              required: true,
            },
            {
              name: 'stream_capacity_mode',
              type: 'String',
              required: true,
            },
            {
              name: 'stream_provisioned_shards',
              type: 'Integer',
              required: false,
            },
          ],
          required: true,
        },
        {
          name: 'KinesisSchemaFormType',
          model: [
            {
              name: 'stream_name',
              type: 'String',
              required: true,
            },
            {
              name: 'schema_version',
              type: 'Integer',
              required: true,
            },
            {
              name: 'schema_arn',
              type: 'String',
              required: true,
            },
            {
              name: 'registry_arn',
              type: 'String',
              required: true,
            },
          ],
          required: true,
        },
      ],
    });
  }
}
