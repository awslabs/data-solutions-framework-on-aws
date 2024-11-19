import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dsf from '../../index';


class ExampleDefaultOpenSearchStack extends cdk.Stack {
  
  constructor(scope: Construct, id: string , props:cdk.StackProps) {
    
    super(scope, id, props);
    /// !show
    const osCluster = new dsf.consumption.OpenSearchCluster(this, 'MyOpenSearchCluster',{
      domainName:"mycluster",
      samlEntityId:'<IdpIdentityId>',
      samlMetadataContent:'<IdpMetadataXml>',
      samlMasterBackendRole:'<IAMIdentityCenterAdminGroupId>',
      deployInVpc:true,
      removalPolicy:cdk.RemovalPolicy.DESTROY
    });

    
    osCluster.addRoleMapping('DashboardOsUser', 'dashboards_user','<IAMIdentityCenterDashboardUsersGroupId>');
    osCluster.addRoleMapping('ReadAllOsRole','readall','<IAMIdentityCenterDashboardUsersGroupId>');
    /// !hide
  }
  
  
}


const app = new cdk.App();
new ExampleDefaultOpenSearchStack(app, 'ExampleDefaultDataLakeStorage', { env: {region:'us-east-1'} });