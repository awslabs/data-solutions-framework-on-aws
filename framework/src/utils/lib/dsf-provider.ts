// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from 'constructs';
import { DsfProviderProps } from './dsf-provider-props';

/**
 * @internal
 */
export class DsfProvider extends Construct
 {

  constructor(scope: Construct, id: string, props: DsfProviderProps) {

    super(scope, id);

  }

}