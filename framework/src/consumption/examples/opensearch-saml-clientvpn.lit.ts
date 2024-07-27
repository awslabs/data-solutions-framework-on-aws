import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dsf from '../../index';


class ExampleDefaultOpenSearchStack extends cdk.Stack {

  constructor(scope: Construct, id: string , props:cdk.StackProps) {

    super(scope, id, props);
    /// !show
    const vpcVpn = new dsf.utils.DataVpc(this, 'VpcWithVpn', {
      vpcCidr:'10.0.0.0/16',
      clientVpnEndpointProps: {
          serverCertificateArn:"<ACMCertificateArn>",
          samlMetadataDocument:`<IdpClientVpnApplicationMetadataXml>`,
          selfServicePortal:false
      }
    })
    const osCluster = new dsf.consumption.OpenSearchCluster(this, 'MyOpenSearchCluster',{
      domainName:"mycluster",
      samlEntityId:'<IdpIdentityId>',
      samlMetadataContent:'<IdpOpenSearchApplicationMetadataXml>',
      samlMasterBackendRole:'<IAMIdentityCenterAdminGroupId>',
      deployInVpc:true,
      vpc:vpcVpn.vpc
    });

    osCluster.addRoleMapping('DashboardOsUser', 'dashboards_user','<IAMIdentityCenterDashboardUsersGroupId>');
    osCluster.addRoleMapping('ReadAllOsRole','readall','<IAMIdentityCenterDashboardUsersGroupId>');
    /// !hide
    
  }


}


const app = new cdk.App();
new ExampleDefaultOpenSearchStack(app, 'ExampleDefaultDataLakeStorage', { env: {region:'us-east-1'} });