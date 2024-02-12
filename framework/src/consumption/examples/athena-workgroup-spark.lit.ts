import { App, Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dsf from '../../index';

/// !show
class ExampleSparkAthenaWorkGroupStack extends Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id)

    const sparkEngineVersion = dsf.consumption.EngineVersion.PYSPARK_V3

    new dsf.consumption.AthenaWorkGroup(this, 'AthenaWorkGroupSpark', {
      name: 'athena-spark',
      engineVersion: sparkEngineVersion,
      resultLocationPrefix: 'athena-wg-results/'
    })
  }
}
/// !hide
const app = new App()
new ExampleSparkAthenaWorkGroupStack(app, 'ExampleSparkAthenaWorkGroupStack')