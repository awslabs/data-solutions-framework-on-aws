// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Stack, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ContextOptions } from './context';
import { TrackedConstructProps } from './tracked-construct-props';
import { DSF_AWS_TAG } from '../../constants';


/**
 * @internal
 * A type of CDK Construct that is tracked via a unique code in CloudFormation Stack description.
 * It is used to measure the number of deployments.
 */
export class TrackedConstruct extends Construct {

  static readonly DSF_TRACKING_CODE = 'uksb-1tupboc21';

  static readonly DSF_OWNED_TAG = `${DSF_AWS_TAG}:owned`;


  /**
   * Format is "Description (uksb_12345abcde) (version:1.2.3) (tag:construct1,construct2)"
   */

  private static readonly trackingRegExp = new RegExp('(.*) \\(' + TrackedConstruct.DSF_TRACKING_CODE + '\\)( \\(version:([^)]*)\\))?( \\(tag:([^)]*)\\))?');
  private static readonly TRACKING_TAG_SEPARATOR = ',';

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

    Tags.of(scope).add(TrackedConstruct.DSF_OWNED_TAG, 'true');
  }

  private updateDescription(currentDescription: string, props: TrackedConstructProps) {
    const fullDescription = TrackedConstruct.trackingRegExp.exec(currentDescription);

    const version = this.retrieveVersion();

    const tag = props.trackingTag.split(TrackedConstruct.TRACKING_TAG_SEPARATOR).join('_'); // make sure there's no separator in the tag name
    if (fullDescription == null) {
      return `${currentDescription} (${TrackedConstruct.DSF_TRACKING_CODE}) (version:${version}) (tag:${tag})`;
    } else {
      const description = fullDescription[1];
      const existingTags = fullDescription[5];

      let newTags;
      if (existingTags) {
        const tags = existingTags.split(TrackedConstruct.TRACKING_TAG_SEPARATOR);
        if (tags.includes(tag)) {
          newTags = existingTags;
        } else {
          newTags = existingTags + TrackedConstruct.TRACKING_TAG_SEPARATOR + tag;
        }
      } else {
        newTags = tag;
      }

      return `${description} (${TrackedConstruct.DSF_TRACKING_CODE}) (version:${version}) (tag:${newTags})`;
    }
  }

  /**
   * Retrieve DSF package.json version
   */
  public retrieveVersion() {
    // We cannot import package.json as a module, because it's not at rootDir, so using direct JS require
    const file = '../../../package.json';
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const json = require(file);
    return json.version;
  }
}