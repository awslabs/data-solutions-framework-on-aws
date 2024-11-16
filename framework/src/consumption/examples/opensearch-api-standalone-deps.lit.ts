import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dsf from '../../index';
import { Role } from 'aws-cdk-lib/aws-iam';


class ExampleOpenSearchApiStack extends cdk.Stack {

  constructor(scope: Construct, id: string , props:cdk.StackProps) {

    super(scope, id, props);
    this.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);
    /// !show
    const domainEndpoint='search-XXXXXX.XXXXXX.es.amazonaws.com';
    const apiRole = Role.fromRoleName(this, 'ApiRole', '<IAMRoleWithOpenSearchPermissions>');
    const osApi = new dsf.consumption.OpenSearchApi(this, 'MyOpenSearchApi',{
      iamHandlerRole:apiRole,
      openSearchEndpoint:domainEndpoint,
      openSearchClusterType:dsf.consumption.OpenSearchClusterType.PROVISIONED,
      removalPolicy:cdk.RemovalPolicy.DESTROY
    });

    const firstCall = osApi.addRoleMapping('AnotherAdmin', 'all_access','<IAMRole>', true);
    const secondCall = osApi.addRoleMapping('AnotherAdmin', 'all_access','<IAMRole>', true);
    
    //dependency to enforce sequential API calls
    secondCall.node.addDependency(firstCall);
    /// !hide

  }
}

const app = new cdk.App();
new ExampleOpenSearchApiStack(app, 'ExampleOpenSearchApiStandaloneDepsStack', { env: {region:'us-east-1'} });