// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { IBucket } from 'aws-cdk-lib/aws-s3';


/**
 * Properties for the {PySparkApplicationPackage} construct
 */
export interface PySparkApplicationPackageProps {

    readonly entrypointPath: string;

    readonly depenciesPath: string;

    readonly pysparkApplicationName: string;

    readonly artefactS3Bucker?: IBucket;

}