// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Utils for working with AWS Step Functions.
 */
export class StepFunctionUtils {

  /**
   * Convert camel case properties to pascal case as required by AWS Step Functions API
   * @param config
   * @returns config converted to pascal case.
   */
  public static camelToPascal(config:{[key:string]: any}) : {[key:string]: any} {
    if (typeof config !== 'object' || config === null) {
      return config;
    }

    if (Array.isArray(config)) {
      return config.map(item => StepFunctionUtils.camelToPascal(item as any));
    }

    const pascalObject:{[key:string]: any} = {};
    for (const key in config) {
      if (config.hasOwnProperty(key)) {
        const pascalKey = key.replace(/^([a-z]{1})/g, (_, letter) => letter.toUpperCase());
        pascalObject[pascalKey] = StepFunctionUtils.camelToPascal(config[key]);
      }
    }

    return pascalObject;
  }
}
