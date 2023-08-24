// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Stack, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ContextOptions } from './context-options';

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
 * Format is "Description (uksb_12345abcde) (tag:construct1-construct2)"
 */
const trackingRegExp = new RegExp('(.+) \\(' + ContextOptions.ADSF_TRACKING_CODE + '\\) \\(tag:(.+)\\)');
const TRACKING_TAG_SEPARATOR = ',';
const ADSF_OWNED_TAG = `${ContextOptions.ADSF_AWS_TAG}:owned`;

/**
 * @internal
 * A type of CDK Construct that is tracked via a unique code in CloudFormation Stack description.
 * It is used to measure the number of deployments.
 */
export class TrackedConstruct extends Construct {

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

    Tags.of(scope).add(ADSF_OWNED_TAG, 'true');
  }

  private updateDescription(currentDescription: string, props: TrackedConstructProps) {
    const fullDescription = trackingRegExp.exec(currentDescription);

    const tag = props.trackingTag.split(TRACKING_TAG_SEPARATOR).join('_'); // make sure there's no separator in the tag name
    if (fullDescription == null) {
      return `${currentDescription} (${ContextOptions.ADSF_TRACKING_CODE}) (tag:${tag})`;
    } else {
      let tags = fullDescription[2] + TRACKING_TAG_SEPARATOR + tag;
      return `${fullDescription[1]} (${ContextOptions.ADSF_TRACKING_CODE}) (tag:${tags})`;
    }
  }
}