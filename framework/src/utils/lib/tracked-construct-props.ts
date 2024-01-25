// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


/**
 * @internal
 * The properties for the `TrackedConstruct` construct.
 */
export interface TrackedConstructProps {
  /**
   * Unique code used to measure the number of CloudFormation deployments of this construct.
   *
   * *Pattern* : `^[A-Za-z0-9-_]+$`
   */
  readonly trackingTag: string;
}