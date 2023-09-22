// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Stack, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ContextOptions } from './context';
import { ADSF_AWS_TAG } from '../constants';

/**
 * The properties for the TrackedConstructProps construct.
 */
export interface TrackedConstructProps {
  /**
   * Unique code used to measure the number of CloudFormation deployments of this construct.
   *
   * *Pattern* : `^[A-Za-z0-9-_]+$`
   */
  readonly trackingTag: string;
}

/**
 * @internal
 * A type of CDK Construct that is tracked via a unique code in CloudFormation Stack description.
 * It is used to measure the number of deployments.
 */
export class TrackedConstruct extends Construct {

  static readonly ADSF_TRACKING_CODE = 'uksb-1tupboc21';

  /**
   * Format is "Description (uksb_12345abcde) (version:1.2.3) (tag:construct1,construct2)"
   */
  private static readonly trackingRegExp = new RegExp('(.+) \\(' + TrackedConstruct.ADSF_TRACKING_CODE + '\\)( \\(version:(.+)\\))? \\(tag:(.+)\\)');
  private static readonly TRACKING_TAG_SEPARATOR = ',';
  private static readonly ADSF_OWNED_TAG = `${ADSF_AWS_TAG}:owned`;

  /**
   * Constructs a new instance of the TrackedConstruct
   * @param {Construct} scope the Scope of the CDK Construct
   * @param {string} id the ID of the CDK Construct
   * @param {TrackedConstructProps} props the TrackedConstruct [properties] {TrackedConstructProps}
   */
  constructor(scope: Construct, id: string, props: TrackedConstructProps) {
    super(scope, id);

    if (!scope.node.tryGetContext(ContextOptions.DISABLE_CONSTRUCTS_DEPLOYMENT_TRACKING)) {
      const stack = Stack.of(this);
      const currentDescription = stack.templateOptions.description || '';

      stack.templateOptions.description = this.updateDescription(currentDescription, props);
    }

    Tags.of(scope).add(TrackedConstruct.ADSF_OWNED_TAG, 'true');
  }

  private updateDescription(currentDescription: string, props: TrackedConstructProps) {
    const fullDescription = TrackedConstruct.trackingRegExp.exec(currentDescription);
    const version = this.getVersion();

    const tag = props.trackingTag.split(TrackedConstruct.TRACKING_TAG_SEPARATOR).join('_'); // make sure there's no separator in the tag name
    if (fullDescription == null) {
      return `${currentDescription} (${TrackedConstruct.ADSF_TRACKING_CODE}) (version:${version}) (tag:${tag})`;
    } else {
      let tags = fullDescription[4] + TrackedConstruct.TRACKING_TAG_SEPARATOR + tag;
      return `${fullDescription[1]} (${TrackedConstruct.ADSF_TRACKING_CODE}) (version:${fullDescription[3]}) (tag:${tags})`;
    }
  }

  private getVersion() {
    // We cannot import package.json as a module, because it's not at rootDir, so using direct JS require
    const file = '../../package.json';
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const json = require(file);
    return json.version;
  }
}