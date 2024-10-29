# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import os

import aws_cdk as cdk

from stacks.main import StreamingGovernanceStack


app = cdk.App()
StreamingGovernanceStack(app, "StreamingGovernanceStack",
    domain_id=os.getenv('DOMAIN_ID'),
    # environment_id=os.getenv('ENVIRONMENT_ID'),
    datazone_portal_role_name=os.getenv('DATAZONE_PORTAL_ROLE_NAME')
)

app.synth()
