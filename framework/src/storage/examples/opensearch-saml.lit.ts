import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { OpensearchProps } from '../lib/opensearch/opensearch-props';
import { OpensearchCluster } from '../lib/opensearch/opensearch';

class ExampleDefaultOpensearchStack extends cdk.Stack {

    constructor(scope: Construct, id: string , props:cdk.StackProps) {

        super(scope, id, props);
/// !show
        const osCluster = new OpensearchCluster(scope, 'MyOpensearchCluster',{
            domainName:"mycluster3",
            samlEntityId:'<IdpIdentityId>',
            samlMetadataContent:'<IdpMetadataXml>',
            samlMasterBackendRole:'<IAMIdentityCenterAdminGroupId>',
            deployInVpc:true,
            removalPolicy:cdk.RemovalPolicy.DESTROY
        } as OpensearchProps);
        osCluster.addRoleMapping('dashboards_user','<IAMIdentityCenterDashboardUsersGroupId>');
        osCluster.addRoleMapping('readall','<IAMIdentityCenterDashboardUsersGroupId>');
/// !hide
    }


}


const app = new cdk.App();
new ExampleDefaultOpensearchStack(app, 'ExampleDefaultDataLakeStorage', { env: {region:'us-east-1'} });