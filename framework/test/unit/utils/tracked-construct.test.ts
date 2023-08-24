// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * Tests tracking construct
 *
 * @group unit/tracking-construct
 */

import { App, Stack } from 'aws-cdk-lib';
import { ContextOptions } from '../../../src/utils/context-options';
import { TrackedConstruct } from '../../../src/utils/tracked-construct';

test('tracked construct add tracking code and tag to description if not explicitly disabled', () => {
  // GIVEN
  const initialStackDescription = 'My Analytics stack';
  const trackingTag = 'trackingTag';

  const testApp = new App();
  const exampleStack = new Stack(testApp, 'testTrackedConstruct', {
    description: initialStackDescription,
  });

  // WHEN
  new TrackedConstruct(exampleStack, 'MyCoreAnalyticsConstruct', { trackingTag });

  // THEN
  expect(exampleStack.templateOptions).toHaveProperty('description', `${initialStackDescription} (${ContextOptions.ADSF_TRACKING_CODE}) (tag:${trackingTag})`);
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
  new TrackedConstruct(exampleStack, 'MyCoreAnalyticsConstruct1', { trackingTag: construct1Tag });
  new TrackedConstruct(exampleStack, 'MyCoreAnalyticsConstruct2', { trackingTag: construct2Tag });

  // THEN
  expect(exampleStack.templateOptions).toHaveProperty('description', `${initialStackDescription} (${ContextOptions.ADSF_TRACKING_CODE}) (tag:${construct1Tag}-${construct2Tag})`);
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
  const trackingTag = 'my-construct-1';

  const testApp = new App();
  const exampleStack = new Stack(testApp, 'testTrackedConstruct', {
    description: initialStackDescription,
  });

  // WHEN
  new TrackedConstruct(exampleStack, 'MyCoreAnalyticsConstruct', { trackingTag });

  // THEN
  expect(exampleStack.templateOptions).toHaveProperty('description', `${initialStackDescription} (${ContextOptions.ADSF_TRACKING_CODE}) (tag:my_construct_1)`);
});