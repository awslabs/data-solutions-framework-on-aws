// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

export enum EngineVersion {
  AUTO = 'AUTO',
  ATHENA_V3 = 'Athena engine version 3',
  PYSPARK_V3 = 'PySpark engine version 3',
}

export enum State {
  ENABLED = 'ENABLED',
  DISABLED = 'DISABLED',
}

export const ENGINE_DEFAULT_VERSION: EngineVersion = EngineVersion.AUTO;
export const WORKGROUP_DEFAULT_STATE: State = State.ENABLED;
