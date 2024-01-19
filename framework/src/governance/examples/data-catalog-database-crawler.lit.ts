// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import { Key } from 'aws-cdk-lib/aws-kms';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import * as dsf from '../../index';

class ExampleDataCatalogDatabaseCrawlerStack extends cdk.Stack {
    constructor(scope: Construct, id: string) {
        super(scope, id);
        const bucket = new Bucket(this, 'DataCatalogBucket');

/// !show
        const encryptionKey = new Key(this, 'CrawlerLogEncryptionKey');

        new dsf.governance.DataCatalogDatabase(this, 'DataCatalogDatabase', {
            locationBucket: bucket,
            locationPrefix: '/databasePath',
            name: 'example-db',
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
new ExampleDataCatalogDatabaseCrawlerStack(app, 'ExampleDataCatalogDatabaseCrawlerStack');