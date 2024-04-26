// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CustomResource, Duration, RemovalPolicy } from 'aws-cdk-lib';
import { IRole, PolicyDocument, Role, ServicePrincipal, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { ILogGroup } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { QuickSightSubscriptionProps, QuickSightAuthenticationMethod } from './quicksight-subscription-props';
import { Context, TrackedConstruct, TrackedConstructProps } from '../../../utils';
import { DsfProvider } from '../../../utils/lib/dsf-provider';


/**
 * Creates an asynchronous custom resource that handles the creation of a QuickSight subscription
 *
 * @example
 * const subscription = new dsf.consumption.QuickSightSubscription(this, 'RedshiftNamespace', {
 *    name: "default",
 *    dbName: 'defaultdb',
 * });
 *
 */

export class QuickSightSubscription extends TrackedConstruct {

  /**
   *
   */
  public static readonly RESOURCE_TYPE = 'Custom::QuickSightSubscription';

  /**
   * The CloudWatch Log Group for the QuickSight account subscription submission
   */
  public readonly submitLogGroup: ILogGroup;
  /**
   * The Lambda Function for the the Redshift Data submission
   */
  public readonly submitFunction: IFunction;
  /**
   * The IAM Role for the QuickSight account subscription execution
   */
  public readonly executionRole: IRole;

  /**
   * The CloudWatch Log Group for the QuickSight account subscription status checks
   */
  public readonly statusLogGroup: ILogGroup;
  /**
   * The Lambda Function for the QuickSight account subscription status checks
   */
  public readonly statusFunction: IFunction;

  /**
 * The CloudWatch Log Group for the QuickSight account subscription cleaning up lambda
 */
  public readonly cleanUpLogGroup?: ILogGroup;
  /**
   * The Lambda function for the QuickSight account subscription cleaning up lambda
   */
  public readonly cleanUpFunction?: IFunction;
  /**
   * The IAM Role for the the QuickSight account subscription cleaning up lambda
   */
  public readonly cleanUpRole?: IRole;

  /**
  * The name of your Amazon QuickSight account. This name is unique over all of Amazon Web Services, and it appears only when users sign in.
  * You can't change AccountName value after the Amazon QuickSight account is created.
  */
  public readonly accountName: string;

  /**
  * The email address that you want Amazon QuickSight to send notifications to regarding your Amazon QuickSight account or Amazon QuickSight subscription.
  */
  readonly notificationEmail: string;

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

  private readonly removalPolicy: RemovalPolicy;

  private readonly serviceToken: string;
  private readonly policyActions: string[];

  constructor (scope: Construct, id: string, props: QuickSightSubscriptionProps) {
    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: QuickSightSubscription.name,
    };
    super(scope, id, trackedConstructProps);

    this.removalPolicy = Context.revertRemovalPolicy(scope, props.removalPolicy);
    this.accountName = props.accountName;
    this.notificationEmail = props.notificationEmail;
    this.adminGroup = props.adminGroup;
    this.authorGroup = props.authorGroup;
    this.readerGroup = props.readerGroup;
    this.identityRegion = props.identityRegion;

    this.policyActions = [
      'quicksight:Subscribe',
      'quicksight:UpdateAccountSettings',
      'quicksight:Create*',
      'quicksight:Unsubscribe',
      'quicksight:DescribeAccountSubscription',
      'sso:GetManagedApplicationInstance',
      'sso:CreateManagedApplicationInstance',
      'sso:GetManagedApplicationInstance',
      'sso:DeleteManagedApplicationInstance',
      'sso:GetManagedApplicationInstance',
      'sso:DescribeGroup',
      'sso:SearchGroups',
      'sso:GetProfile',
      'sso:AssociateProfile',
      'sso:DisassociateProfile',
      'sso:ListProfiles',
      'sso:ListDirectoryAssociations',
      'sso:DescribeRegisteredRegions',
    ];

    if (props.authenticationMethod != QuickSightAuthenticationMethod.IAM_IDENTITY_CENTER) {
      this.policyActions = this.policyActions.concat(
        [
          'ds:AuthorizeApplication',
          'ds:UnauthorizeApplication',
          'ds:CheckAlias',
          'ds:CreateAlias',
          'ds:DescribeDirectories',
          'ds:DescribeTrusts',
          'ds:DeleteDirectory',
          'ds:CreateIdentityPoolDirectory',
        ],
      );
    }

    this.executionRole = new Role(this, 'Role', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        QuickSightSubscription: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: this.policyActions,
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    const timeout = props.executionTimeout ?? Duration.minutes(5);

    const provider = new DsfProvider(this, 'CrProvider', {
      providerName: 'QuickSightSubscriptionProvider',
      onEventHandlerDefinition: {
        depsLockFilePath: __dirname+'/resources/QuickSightSubscription/package-lock.json',
        entryFile: __dirname+'/resources/QuickSightSubscription/index.mjs',
        handler: 'index.onEventHandler',
        environment: {
          AUTHENTICATION_METHOD: props.authenticationMethod,
          AWS_ACCOUNT_ID: props.awsAccountId,
          EDITION: props.edition,
          IDENTITY_REGION: props.identityRegion,
        },
        iamRole: this.executionRole,
        timeout,
      },
      isCompleteHandlerDefinition: {
        iamRole: this.executionRole,
        handler: 'index.isCompleteHandler',
        depsLockFilePath: __dirname+'/resources/QuickSightSubscription/package-lock.json',
        entryFile: __dirname+'/resources/QuickSightSubscription/index.mjs',
        timeout,
        environment: {
          AUTHENTICATION_METHOD: props.authenticationMethod,
          AWS_ACCOUNT_ID: props.awsAccountId,
          EDITION: props.edition,
          IDENTITY_REGION: props.identityRegion,
        },
      },
      queryInterval: Duration.seconds(10),
      removalPolicy: this.removalPolicy,
    });

    this.serviceToken = provider.serviceToken;
    this.submitLogGroup = provider.onEventHandlerLogGroup;
    this.statusLogGroup = provider.isCompleteHandlerLog!;
    this.cleanUpLogGroup = provider.cleanUpLogGroup;
    this.submitFunction = provider.onEventHandlerFunction;
    this.statusFunction = provider.isCompleteHandlerFunction!;
    this.cleanUpFunction = provider.cleanUpFunction;
    this.cleanUpRole = provider.cleanUpRole;

  }


  public createQuickSightSubscription() {
    return new CustomResource(this, 'QuickSightSubscription', {
      resourceType: QuickSightSubscription.RESOURCE_TYPE,
      serviceToken: this.serviceToken,
      properties: {
        accountName: this.accountName,
        notificationEmail: this.notificationEmail,
        readerGroup: this.readerGroup,
        authorGroup: this.authorGroup,
        adminGroup: this.adminGroup,
      },
      removalPolicy: this.removalPolicy,
    });
  }
}