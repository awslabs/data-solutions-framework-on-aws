import { RemovalPolicy } from 'aws-cdk-lib';
import { ISecurityGroup, IVpc, SubnetSelection } from 'aws-cdk-lib/aws-ec2';
import { EventBus } from 'aws-cdk-lib/aws-events';

export interface DataZoneMSKConsumerAuthorizerProps {
  readonly consumerAuthorizerEventBus: EventBus;
  readonly mskConnectionVPC: IVpc;
  readonly mskConnectionSubnetSelection: SubnetSelection;
  readonly mskConnectionSecurityGroups: ISecurityGroup[];
  readonly removalPolicy?: RemovalPolicy;
}