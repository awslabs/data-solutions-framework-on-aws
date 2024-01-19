// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dsf from '../../index';

class ExamplePySparkApplicationPackageStack extends cdk.Stack {
    constructor(scope: Construct, id: string) {
        super(scope, id);

/// !show
        new dsf.processing.PySparkApplicationPackage(this, 'PySparkApplicationPackage', {
            applicationName: 'nightly-job-aggregation',
            entrypointPath: './../spark/src/entrypoint.py',
            dependenciesFolder: './../spark',
            venvArchivePath: '/venv-package/pyspark-env.tar.gz',
        });
/// !hide
    }
}

const app = new cdk.App();
new ExamplePySparkApplicationPackageStack(app, 'ExamplePySparkApplicationPackageStack');
