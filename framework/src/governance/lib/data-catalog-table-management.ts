// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Construct } from 'constructs';
import { TrackedConstruct, TrackedConstructProps } from '../../utils';

export class TableManagement extends TrackedConstruct {

    constructor(scope: Construct, id: string) {

        const trackedConstructProps: TrackedConstructProps = {
          trackingTag: TableManagement.name,
        };

        super(scope, id, trackedConstructProps);
    }

}
