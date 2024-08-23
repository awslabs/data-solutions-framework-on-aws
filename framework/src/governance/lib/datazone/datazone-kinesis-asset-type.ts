import { RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CustomAssetType, DataZoneCustomAssetTypeFactory } from './datazone-custom-asset-type-factory';
import { DataZoneKinesisAssetTypeProps } from './datazone-kinesis-asset-type-props';
import { Context, TrackedConstruct, TrackedConstructProps } from '../../../utils';

export class DataZoneKinesisAssetType extends TrackedConstruct {
  readonly kinesisCustomAssetType: CustomAssetType;

  private readonly removalPolicy: RemovalPolicy;
  constructor(scope: Construct, id: string, props: DataZoneKinesisAssetTypeProps) {
    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: DataZoneKinesisAssetType.name,
    };

    super(scope, id, trackedConstructProps);
    this.removalPolicy = Context.revertRemovalPolicy(this, props.removalPolicy);

    const dzCustomAssetTypeFactory: DataZoneCustomAssetTypeFactory = props.dzCustomAssetTypeFactory || new DataZoneCustomAssetTypeFactory(this, 'DZCustomAssetTypeHandler', {
      removalPolicy: this.removalPolicy,
    });

    this.kinesisCustomAssetType = dzCustomAssetTypeFactory.createCustomAssetType('KinesisCustomAssetType', {
      assetTypeName: 'KinesisStreamAssetType',
      assetTypeDescription: 'Custom asset type to support Kinesis Stream asset',
      domainId: props.domainId,
      projectId: props.projectId,
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