import { App, Duration, Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Key } from 'aws-cdk-lib/aws-kms';
import * as dsf from '../../index';

class ExamplePropertiesAthenaWorkGroupStack extends Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id)

    const userDataKey = new Key(this, 'userDataKey')

    /// !show
    new dsf.consumption.AthenaWorkGroup(this, 'AthenaWorkGroupProperties', {
      name: 'athena-properties',
      bytesScannedCutoffPerQuery: 104857600,
      resultLocationPrefix: 'athena-results/',
      resultsEncryptionKey: userDataKey,
      resultsRetentionPeriod: Duration.days(1),
    })
    /// !hide
  }
}
const app = new App()
new ExamplePropertiesAthenaWorkGroupStack(app, 'ExamplePropertiesAthenaWorkGroupStack')
