// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


import { randomUUID } from 'crypto';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AwsCdkCli, ICloudAssemblyDirectoryProducer, RequireApproval } from '@aws-cdk/cli-lib-alpha';
import { App, Stack } from 'aws-cdk-lib';

/**
 * Test stack that can be deployed to the selected environment.
 */
class TestStack implements ICloudAssemblyDirectoryProducer {
  /**
   * Reference to the AWS CDK App object.
   * @default new App()
   */
  public app: App;
  /**
   * Reference to the AWS CDK Stack object.
   * @default new Stack(this.app, stackName)
   */
  public stack: Stack;
  /**
   * @internal
   * Reference to the AWS CDK CLI object.
   */
  #cli: AwsCdkCli;

  public constructor(stackName: string, app?: App, stack?: Stack) {
    this.app = app ?? new App();
    this.stack = stack ?? new Stack(this.app, stackName + '-' + randomUUID().substring(0, 8).toLowerCase());
    this.#cli = AwsCdkCli.fromCloudAssemblyDirectoryProducer(this);
  }

  /**
   * Deploy the test stack to the selected environment.
   *
   * It returns the outputs of the deployed stack.
   */
  public async deploy(): Promise<Record<string, string>> {
    const outputFilePath = join(
      tmpdir(),
      'adsf-e2e-testing',
      `${this.stack.stackName}.outputs.json`,
    );
    await this.#cli.deploy({
      stacks: [this.stack.stackName],
      requireApproval: RequireApproval.NEVER,
      outputsFile: outputFilePath,
    });

    return JSON.parse(await readFile(outputFilePath, 'utf-8'))[
      this.stack.stackName
    ];
  }

  /**
   * Destroy the test stack.
   */
  public async destroy(): Promise<void> {
    await this.#cli.destroy({
      stacks: [this.stack.stackName],
      requireApproval: false,
    });
  }

  /**
   * Produce the Cloud Assembly directory.
   */
  public async produce(_context: Record<string, unknown>): Promise<string> {
    return this.app.synth().directory;
  }

  /**
   * Synthesize the test stack.
   */
  public async synth(): Promise<void> {
    await this.#cli.synth({
      stacks: [this.stack.stackName],
    });
  }
}

export { TestStack };