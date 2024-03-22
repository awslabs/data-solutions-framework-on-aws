// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Duration, RemovalPolicy } from "aws-cdk-lib";


/**
 * The properties for the `QuickSightSubscription` construct
 */

export interface QuickSightSubscriptionProps {
  
  /**
   * The name of your Amazon QuickSight account. This name is unique over all of Amazon Web Services, and it appears only when users sign in. 
   * You can't change AccountName value after the Amazon QuickSight account is created.
   */
  readonly accountName: string;
  
  /**
   * The email address that you want Amazon QuickSight to send notifications to regarding your Amazon QuickSight account or Amazon QuickSight subscription.
   */
  readonly notificationEmail: string;
  
  /**
  * The edition of Amazon QuickSight that you want your account to have. Currently, you can choose from ENTERPRISE or ENTERPRISE_AND_Q .
  *  @default - ENTERPRISE is used as default.
  */
  readonly edition: string;
  
  /**
   * The Amazon Web Services account ID of the account that you're using to create your Amazon QuickSight account.
   */
  readonly awsAccountId: string;
  

  /**
   * The method that you want to use to authenticate your Amazon QuickSight account.
   * Only IAM_IDENTITY_CENTER, IAM_AND_QUICKSIGHT and IAM_ONLY are supported
   */
  readonly authenticationMethod: 'IAM_IDENTITY_CENTER'| 'IAM_AND_QUICKSIGHT' | 'IAM_ONLY';


  /**
   * The admin group associated with your Active Directory or IAM Identity Center account. This field is required as IAM_IDENTITY_CENTER is 
   * the only supported authentication method of the new Amazon QuickSight account
   */
  readonly adminGroup: string[];
 
  
  /**
   * The author group associated with your IAM Identity Center account.
   */
  readonly authorGroup: string[];

  /**
   * The reader group associated with your IAM Identity Center account.
   */
  readonly readerGroup: string[];

  /**
   * The region to use as main QuickSight region (used to store configuration and identities info)
   */
  readonly identityRegion: string;

  /**
   * The timeout for the QuickSight account subscription.
   * @default - 5mins
   */
  readonly executionTimeout?: Duration;

    /**
   * The removal policy when deleting the CDK resource.
   * If DESTROY is selected, context value `@data-solutions-framework-on-aws/removeDataOnDestroy` needs to be set to true.
   * Otherwise, the removalPolicy is reverted to RETAIN.
   * @default - The resources are not deleted (`RemovalPolicy.RETAIN`).
   */
    readonly removalPolicy?: RemovalPolicy;

}