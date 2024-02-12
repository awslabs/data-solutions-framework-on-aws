import { App, Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import * as dsf from '../../index';

class ExampleGrantAthenaWorkGroupStack extends Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id)

    const athenaExampleRole = new Role(this, 'AthenaWgExampleRole', {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com')
    })
    /// !show
    const athenaWg = new dsf.consumption.AthenaWorkGroup(this, 'AthenaWorkGroupGrant', {
      name: 'athena-grant',
      resultLocationPrefix: 'athena-results/',
    })

    athenaWg.grantRunQueries(athenaExampleRole)
    /// !hide
  }
}
const app = new App()
new ExampleGrantAthenaWorkGroupStack(app, 'ExampleGrantAthenaWorkGroupStack')
