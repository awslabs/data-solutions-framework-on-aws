import { RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DataZoneMSKAssetTypeProps } from './datazone-msk-asset-type-props';
import { Context, TrackedConstruct, TrackedConstructProps } from '../../../utils';
import { CustomAssetType, DataZoneCustomAssetTypeFactory } from './datazone-custom-asset-type-factory';

export class DataZoneMSKAssetType extends TrackedConstruct {
  readonly mskCustomAssetType: CustomAssetType;

  private readonly removalPolicy: RemovalPolicy;
  constructor(scope: Construct, id: string, props: DataZoneMSKAssetTypeProps) {
    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: DataZoneMSKAssetType.name,
    };

    super(scope, id, trackedConstructProps);
    this.removalPolicy = Context.revertRemovalPolicy(this, props.removalPolicy);

    const dzCustomAssetTypeFactory: DataZoneCustomAssetTypeFactory = props.dzCustomAssetTypeFactory || new DataZoneCustomAssetTypeFactory(this, 'DZCustomAssetTypeHandler', {
      removalPolicy: this.removalPolicy,
    });

    this.mskCustomAssetType = dzCustomAssetTypeFactory.createCustomAssetType('MSKCustomAssetType', {
      assetTypeName: 'MSKAssetType',
      assetTypeDescription: 'Custom asset type to support MSK data assets',
      domainId: props.domainId,
      projectId: props.projectId,
      formTypes: [
        {
          name: 'KafkaForm',
          model: `
                        structure KafkaForm {
                            @required
                            cluster_arn: String
                        }
                    `,
          required: true,
        },
        {
          name: 'KafkaSchemaForm',
          model: `
                        structure KafkaSchemaForm {
                            @required
                            kafka_topic: String

                            @required
                            schema_version: Integer

                            @required
                            schema_arn: String

                            @required
                            registry_arn: String
                        }
                    `,
          required: true,
        },
      ],
    });
  }
}