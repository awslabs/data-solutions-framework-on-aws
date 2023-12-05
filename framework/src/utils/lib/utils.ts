// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


import { createHmac } from 'crypto';
import * as fs from 'fs';
import { Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as yaml from 'js-yaml';

/**
 * Utilities class used across the different resources
 */
export class Utils {

  /**
   * Sanitize a string by removing upper case and replacing special characters except underscore
   * @param {string} toSanitize the string to sanitize
   */
  public static stringSanitizer(toSanitize: string): string {
    return toSanitize.toLowerCase().replace(/[^\w\s]/gi, '');
  }

  /**
   * Create a random string to be used as a seed for IAM User password
   * @param {string} name the string to which to append a random string
   */
  public static randomize(name: string) {
    return `${name}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  }

  /**
   * Read a YAML file from the path provided and return it
   * @param {string} path the path to the file
   */
  public static readYamlDocument(path: string): string {
    try {
      const doc = fs.readFileSync(path, 'utf8');
      return doc;
    } catch (e) {
      console.log(e + ' for path: ' + path);
      throw e;
    }
  }

  /**
   * Take a document stored as string and load it as YAML
   * @param {string} document the document stored as string
   */
  public static loadYaml(document: string): any {
    return yaml.load(document);
  }

  /**
   * Convert a string to PascalCase
   * @param text
   * @returns
   */
  public static toPascalCase(text: string): string {

    // Split the text into words
    const words = text.match(/[a-z]+/gi);

    if (words) {
      // Capitalize first letter of each word
      words.forEach((word, index) => {
        words[index] = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      });

      // Join the words back into a string
      return words.join('');
    }

    return text;
  }

  /**
   * Generate an 8 character hash from a string based on HMAC algorithm
   * @param {string} text the text to hash
   * @return {string} the hash
   */
  public static generateHash(text: string): string {
    return createHmac('sha256', 'Data Solutions Framework on AWS')
      .update(text)
      .digest('hex')
      .slice(0, 8);
  }

  /**
   * Generate an 8 characters hash of the CDK scope using its path.
   * @param {Construct} scope the CDK construct scope
   * @returns {string} the hash
   */
  public static generateScopeHash(scope: Construct): string {
    const node = scope.node;

    const components = node.scopes.slice(1).map(c => c.node.id).join('-');

    return this.generateHash(components);
  }
  /**
   * Generate a unique hash of 8 characters from the CDK scope using its path and the stack name.
   * @param scope the CDK construct scope
   * @returns the hash
   */
  public static generateUniqueHash(scope: Construct, id: string): string {
    const node = scope.node;
    const stackName = Stack.of(scope).stackName;
    const components = node.scopes.slice(1).map(c => c.node.id).join('-').concat(id, stackName);

    const secret = 'Data Solutions Framework on AWS';
    const hash = createHmac('sha256', secret)
      .update(components)
      .digest('hex')
      .slice(0, 8);

    return hash;
  }
}
