// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { RemovalPolicy } from 'aws-cdk-lib';
import { CfnProject } from 'aws-cdk-lib/aws-datazone';
import { Construct } from 'constructs';
import { CustomAssetType, DataZoneCustomAssetTypeFactory } from './datazone-custom-asset-type-factory';
import { DataZoneMskAssetTypeProps } from './datazone-msk-asset-type-props';
import { Context, TrackedConstruct, TrackedConstructProps } from '../../../utils';


/**
 * A DataZone custom asset type representing an MSK topic.
 *
 * @example
 * new dsf.governance.DataZoneMskAssetType(this, 'MskAssetType', {
 *   domainId: 'aba_dc999t9ime9sss',
 *   projectId: '999999b3m5cpz',
 * });
 */
export class DataZoneMskAssetType extends TrackedConstruct {
  /**
   * The custom asset type for MSK
   */
  readonly mskCustomAssetType: CustomAssetType;
  /**
   * The project owning the MSK asset type
   */
  readonly owningProject?: CfnProject;


  private readonly removalPolicy: RemovalPolicy;

  /**
   * Construct an instance of the DataZoneMskAssetType
   * @param scope the Scope of the CDK Construct
   * @param id the ID of the CDK Construct
   * @param props The DataZoneMskAssetTypeProps properties
   */
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
      this.owningProject = new CfnProject(this, 'MskAssetTypeProjectOwner', {
        name: 'MskGovernance',
        domainIdentifier: props.domainId,
      });
    }

    this.mskCustomAssetType = dzCustomAssetTypeFactory.createCustomAssetType('MskCustomAssetType', {
      assetTypeName: 'MskTopicAssetType',
      assetTypeDescription: 'Custom asset type to support MSK topic asset',
      projectId: props.projectId || this.owningProject!.attrId,
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
            },
            {
              name: 'schema_arn',
              type: 'String',
            },
            {
              name: 'registry_arn',
              type: 'String',
            },
            {
              name: 'compatibility_mode',
              type: 'String',
            },
            {
              name: 'data_format',
              type: 'String',
            },
          ],
          required: true,
        },
      ],
    });
  }
}