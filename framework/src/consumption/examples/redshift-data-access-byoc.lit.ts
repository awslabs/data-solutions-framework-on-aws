import { App, Duration, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import { RedshiftData } from "../lib";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Vpc } from "aws-cdk-lib/aws-ec2";


class ExampleRedshiftDataStack extends Stack {
    constructor(scope: Construct, id: string) {
      super(scope, id)

      /// !show
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
      })

      dataAccess.runCustomSQL('ExampleSql', 'default', 'SHOW DATABASES');
      /// !hide
    }
  }
const app = new App()
new ExampleRedshiftDataStack(app, "ExampleRedshiftDataStack")