// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


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