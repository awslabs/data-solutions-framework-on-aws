import { Construct } from "constructs";
import { Context, TrackedConstruct, TrackedConstructProps } from "../../utils";
import { RemovalPolicy } from "aws-cdk-lib";
import { DataZoneMskCentralAuthorizerProps } from "./datazone-msk-central-authorizer-props";


export class DataZoneMskEnvironmentAuthorizer extends TrackedConstruct {

  private readonly removalPolicy: RemovalPolicy;
  
  constructor(scope: Construct, id: string, props: DataZoneMskCentralAuthorizerProps) {
    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: DataZoneMskEnvironmentAuthorizer.name,
    };
    
    super(scope, id, trackedConstructProps);
    
    this.removalPolicy = Context.revertRemovalPolicy(this, props.removalPolicy)
    
  }
}