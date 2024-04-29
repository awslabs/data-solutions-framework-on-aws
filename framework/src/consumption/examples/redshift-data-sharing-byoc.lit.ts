import { App, Duration, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import { RedshiftData, RedshiftDataSharing } from "../lib";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
/// !show
class ExampleRedshiftDataSharingCrossAccountAStack extends Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id)

    const redshiftAdminSecret = Secret.fromSecretPartialArn(this, 'RedshiftAdminCredentials', 'arn:aws:secretsmanager:us-east-1:XXXXXXXX:secret:YYYYYYYY');

    const redshiftVpc = Vpc.fromLookup(this, 'RedshiftVpc', {
      vpcId: 'XXXXXXXX',
    });

    const dataAccess = new RedshiftData(this, 'RedshiftDataAccess', {
      workgroupId: 'XXXXXXXXXXXXXXX',
      secret: redshiftAdminSecret,
      vpc: redshiftVpc,
      subnets: redshiftVpc.selectSubnets({
        subnetGroupName: 'YYYYYYYY'
      }),
      createInterfaceVpcEndpoint: true,
      executionTimeout: Duration.minutes(10),
    });

    const dataShare = new RedshiftDataSharing(this, 'RedshiftDataShare', {
      redshiftData: dataAccess,
      workgroupId: 'XXXXXXXXXXXXXXX',
      secret: redshiftAdminSecret,
      vpc: redshiftVpc,
      subnets: redshiftVpc.selectSubnets({
        subnetGroupName: 'YYYYYYYY'
      }),
      createInterfaceVpcEndpoint: true,
      executionTimeout: Duration.minutes(10),
    });

    const share = dataShare.createShare('ProducerShare', 'default', 'example_share', 'public', ['public.customers']);
    
    const grantToConsumer = dataShare.grant('GrantToConsumer', {
      dataShareName: 'example_share', 
      databaseName: 'default',
      autoAuthorized: true,
      accountId: "<CONSUMER_ACCOUNT_ID>",
      dataShareArn: '<DATASHARE_ARN>',
    });
    
    grantToConsumer.resource.node.addDependency(share);
  }
}

class ExampleRedshiftDataSharingCrossAccountBStack extends Stack {
    constructor(scope: Construct, id: string) {
      super(scope, id)
  
      const redshiftAdminSecret = Secret.fromSecretPartialArn(this, 'RedshiftAdminCredentials', 'arn:aws:secretsmanager:us-east-1:XXXXXXXX:secret:YYYYYYYY');

      const redshiftVpc = Vpc.fromLookup(this, 'RedshiftVpc', {
        vpcId: 'XXXXXXXX',
      });
  
      const dataAccess = new RedshiftData(this, 'RedshiftDataAccess', {
        workgroupId: 'XXXXXXXXXXXXXXX',
        secret: redshiftAdminSecret,
        vpc: redshiftVpc,
        subnets: redshiftVpc.selectSubnets({
          subnetGroupName: 'YYYYYYYY'
        }),
        createInterfaceVpcEndpoint: true,
        executionTimeout: Duration.minutes(10),
      });
  
      const dataShare = new RedshiftDataSharing(this, 'RedshiftDataShare', {
        redshiftData: dataAccess,
        workgroupId: 'XXXXXXXXXXXXXXX',
        secret: redshiftAdminSecret,
        vpc: redshiftVpc,
        subnets: redshiftVpc.selectSubnets({
          subnetGroupName: 'YYYYYYYY'
        }),
        createInterfaceVpcEndpoint: true,
        executionTimeout: Duration.minutes(10),
      });
  
      dataShare.createDatabaseFromShare('ProducerShare', {
        consumerNamespaceArn: '',
        newDatabaseName: 'db_from_share',
        databaseName: 'default',
        dataShareName: 'example_share',
        dataShareArn: '<DATASHARE_ARN>',
        accountId: "<PRODUCER_ACCOUNT_ID>",
      });
    }
  }
/// !hide
const app = new App();
new ExampleRedshiftDataSharingCrossAccountAStack(app, "ExampleRedshiftDataSharingCrossAccountAStack");
new ExampleRedshiftDataSharingCrossAccountBStack(app, "ExampleRedshiftDataSharingCrossAccountBStack");