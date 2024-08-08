import { RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CustomAssetType, DataZoneCustomAssetTypeFactory } from './datazone-custom-asset-type-factory';
import { DataZoneMskAssetTypeProps } from './datazone-msk-asset-type-props';
import { Context, TrackedConstruct, TrackedConstructProps } from '../../../utils';

export class DataZoneMskAssetType extends TrackedConstruct {
  readonly mskCustomAssetType: CustomAssetType;

  private readonly removalPolicy: RemovalPolicy;
  constructor(scope: Construct, id: string, props: DataZoneMskAssetTypeProps) {
    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: DataZoneMskAssetType.name,
    };

    super(scope, id, trackedConstructProps);
    this.removalPolicy = Context.revertRemovalPolicy(this, props.removalPolicy);

    const dzCustomAssetTypeFactory: DataZoneCustomAssetTypeFactory = props.dzCustomAssetTypeFactory || new DataZoneCustomAssetTypeFactory(this, 'DZCustomAssetTypeHandler', {
      removalPolicy: this.removalPolicy,
    });

    this.mskCustomAssetType = dzCustomAssetTypeFactory.createCustomAssetType('MskCustomAssetType', {
      assetTypeName: 'MskTopicAssetType',
      assetTypeDescription: 'Custom asset type to support MSK topic asset',
      domainId: props.domainId,
      projectId: props.projectId,
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
              type: 'String',
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