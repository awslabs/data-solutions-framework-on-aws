import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dsf from '../../index';


class ExampleDefaultOpensearchStack extends cdk.Stack {
  
  constructor(scope: Construct, id: string , props:cdk.StackProps) {
    
    super(scope, id, props);
    /// !show
    vpcVpn
    const osCluster = new dsf.consumption.OpensearchCluster(scope, 'MyOpensearchCluster',{
      domainName:"mycluster",
      samlEntityId:'<IdpIdentityId>',
      samlMetadataContent:'<IdpMetadataXml>',
      samlMasterBackendRole:'<IAMIdentityCenterAdminGroupId>',
      deployInVpc:true
    });
    /// !hide
    osCluster.addRoleMapping('dashboards_user','<IAMIdentityCenterDashboardUsersGroupId>');
    osCluster.addRoleMapping('readall','<IAMIdentityCenterDashboardUsersGroupId>');
  }
  
  
}


const app = new cdk.App();
new ExampleDefaultOpensearchStack(app, 'ExampleDefaultDataLakeStorage', { env: {region:'us-east-1'} });