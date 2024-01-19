// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import { Key } from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';
import * as dsf from '../../index';

class ExampleDefaultDataLakeCatalogStack extends cdk.Stack {
    constructor(scope: Construct, id: string) {
        super(scope, id);
        const storage = new dsf.storage.DataLakeStorage(this, 'MyDataLakeStorage');

/// !show
        const encryptionKey = new Key(this, 'CrawlerLogEncryptionKey');

        new dsf.governance.DataLakeCatalog(this, 'DataCatalog', {
            dataLakeStorage: storage,
            autoCrawl: true,
            autoCrawlSchedule: {
                scheduleExpression: 'cron(1 0 * * ? *)',
            },
            crawlerLogEncryptionKey: encryptionKey,
            crawlerTableLevelDepth: 3,
        });
/// !hide
    }
}

const app = new cdk.App();
new ExampleDefaultDataLakeCatalogStack(app, 'ExampleDefaultDataLakeCatalogStack');