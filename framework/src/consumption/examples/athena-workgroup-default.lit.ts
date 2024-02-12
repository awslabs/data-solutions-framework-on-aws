import { App, Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dsf from '../../index';

class ExampleDefaultAthenaWorkGroupStack extends Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id)

    /// !show
    new dsf.consumption.AthenaWorkGroup(this, 'AthenaWorkGroupDefault', {
      name: 'athena-default',
      resultLocationPrefix: 'athena-default-results/'
    })
    /// !hide
  }
}
const app = new App()
new ExampleDefaultAthenaWorkGroupStack(app, 'ExampleDefaultAthenaWorkGroupStack')