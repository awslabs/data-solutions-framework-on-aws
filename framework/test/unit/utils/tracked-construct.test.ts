// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * Tests tracking construct
 *
 * @group unit/tracking-construct
 */

import { App, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { ADSF_AWS_TAG } from '../../../src/constants';
import { ContextOptions, TrackedConstruct, TrackedConstructProps } from '../../../src/utils';

test('tracked construct add tracking code and tag to description if not explicitly disabled', () => {
  // GIVEN
  const initialStackDescription = 'My Analytics stack';
  const trackingTag = 'trackingTag';

  const testApp = new App();
  const exampleStack = new Stack(testApp, 'testTrackedConstruct', {
    description: initialStackDescription,
  });

  // WHEN
  const construct = new TrackedConstruct(exampleStack, 'MyCoreAnalyticsConstruct', { trackingTag });

  // THEN
  expect(exampleStack.templateOptions).toHaveProperty('description', `${initialStackDescription} (${TrackedConstruct.ADSF_TRACKING_CODE}) (version:${construct.retrieveVersion()}) (tag:${trackingTag})`);
});

test('tracked construct add as many tags in the description as tracked constructs in the stack', () => {
  // GIVEN
  const initialStackDescription = 'My super Analytics stack';
  const construct1Tag = 'construct1';
  const construct2Tag = 'construct2';

  const testApp = new App();
  const exampleStack = new Stack(testApp, 'testTrackedConstruct', {
    description: initialStackDescription,
  });

  // WHEN
  const construct =new TrackedConstruct(exampleStack, 'MyCoreAnalyticsConstruct1', { trackingTag: construct1Tag });
  new TrackedConstruct(exampleStack, 'MyCoreAnalyticsConstruct2', { trackingTag: construct2Tag });

  // THEN
  expect(exampleStack.templateOptions).toHaveProperty('description', `${initialStackDescription} (${TrackedConstruct.ADSF_TRACKING_CODE}) (version:${construct.retrieveVersion()}) (tag:${construct1Tag},${construct2Tag})`);
});

test('tracked construct don\'t add tracking code to description if explicitly disabled', () => {

  // GIVEN
  const initialStackDescription = 'My Analytics stack';
  const trackingTag = 'trackingcode';
  const context: any = {};
  context[ContextOptions.DISABLE_CONSTRUCTS_DEPLOYMENT_TRACKING] = true;
  const testApp = new App({ context });
  const exampleStack = new Stack(testApp, 'testTrackedConstruct', {
    description: initialStackDescription,
  });

  // WHEN
  new TrackedConstruct(exampleStack, 'MyCoreAnalyticsConstruct', { trackingTag });

  // THEN
  expect(exampleStack.templateOptions).toHaveProperty('description', initialStackDescription);
});

test('tracked construct add tracking code and tag without separator to description', () => {
  // GIVEN
  const initialStackDescription = 'My Analytics stack';
  const trackingTag = 'my-construct,1';

  const testApp = new App();
  const exampleStack = new Stack(testApp, 'testTrackedConstruct', {
    description: initialStackDescription,
  });

  // WHEN
  const construct = new TrackedConstruct(exampleStack, 'MyCoreAnalyticsConstruct', { trackingTag });

  // THEN
  expect(exampleStack.templateOptions).toHaveProperty('description', `${initialStackDescription} (${TrackedConstruct.ADSF_TRACKING_CODE}) (version:${construct.retrieveVersion()}) (tag:my-construct_1)`);
});

class TestTrackedConstruct extends TrackedConstruct {

  constructor(scope: Construct, id: string) {
    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: 'TestTrackedConstruct',
    };
    super(scope, id, trackedConstructProps);
    new Bucket(this, 'TestTrackedConstructWithBucket');
  }
}

test('tracked construct add adsf:owned tag to the inner resources', () => {
  // GIVEN
  const initialStackDescription = 'My Analytics stack';

  const testApp = new App();
  const exampleStack = new Stack(testApp, 'testTrackedConstruct', {
    description: initialStackDescription,
  });

  // WHEN
  new TestTrackedConstruct(exampleStack, 'MyTestTrackedConstruct');
  const template = Template.fromStack(exampleStack);

  // console.log(JSON.stringify(template));

  // THEN
  template.hasResource('AWS::S3::Bucket',
    Match.objectLike({
      Properties: {
        Tags: [
          {
            Key: `${ADSF_AWS_TAG}:owned`,
            Value: 'true',
          },
        ],
      },
    }),
  );
});
