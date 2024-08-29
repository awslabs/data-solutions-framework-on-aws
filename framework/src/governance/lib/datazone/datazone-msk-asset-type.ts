// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CustomAssetType, DataZoneCustomAssetTypeFactory } from './datazone-custom-asset-type-factory';
import { DataZoneMskAssetTypeProps } from './datazone-msk-asset-type-props';
import { Context, TrackedConstruct, TrackedConstructProps } from '../../../utils';
import { CfnProject } from 'aws-cdk-lib/aws-datazone';

export class DataZoneMskAssetType extends TrackedConstruct {
  /**
   * The MSK asset type
   */
  readonly mskCustomAssetType: CustomAssetType;
  /**
   * The project owning the MSK asset type
   */
  readonly owningProjectId?: CfnProject;


  private readonly removalPolicy: RemovalPolicy;

  constructor(scope: Construct, id: string, props: DataZoneMskAssetTypeProps) {
    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: DataZoneMskAssetType.name,
    };

    super(scope, id, trackedConstructProps);
    this.removalPolicy = Context.revertRemovalPolicy(this, props.removalPolicy);

    const dzCustomAssetTypeFactory: DataZoneCustomAssetTypeFactory = props.dzCustomAssetTypeFactory || new DataZoneCustomAssetTypeFactory(this, 'DZCustomAssetTypeHandler', {
      domainId: props.domainId,
      removalPolicy: this.removalPolicy,
    });

    if (props.projectId === undefined) {
      this.owningProjectId = new CfnProject(this, 'MskAssetTypeProjectOwner', {
        name: 'MskGovernance',
        domainIdentifier: props.domainId,
      });
    }

    this.mskCustomAssetType = dzCustomAssetTypeFactory.createCustomAssetType('MskCustomAssetType', {
      assetTypeName: 'MskTopicAssetType',
      assetTypeDescription: 'Custom asset type to support MSK topic asset',
      projectId: props.projectId || this.owningProjectId!.attrId,
      formTypes: [
        {
          name: 'amazon.datazone.RelationalTableFormType',
          required: true,
        },
        {
          name: 'MskSourceReferenceFormType',
          model: [
            {
              name: 'cluster_arn',
              type: 'String',
              required: true,
            },
            {
              name: 'cluster_type',
              type: 'String',
              required: true,
            },
          ],
          required: true,
        },
        {
          name: 'KafkaSchemaFormType',
          model: [
            {
              name: 'kafka_topic',
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