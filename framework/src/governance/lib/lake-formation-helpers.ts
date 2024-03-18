// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { DefaultStackSynthesizer, Fn, Stack } from 'aws-cdk-lib';
import { IRole, ISamlProvider, IUser, Role } from 'aws-cdk-lib/aws-iam';
import { CfnDataLakeSettings } from 'aws-cdk-lib/aws-lakeformation';
import { Construct } from 'constructs';


/**
* Adds the CDK execution role to LF admins
* @param scope the construct scope
* @param id the construct id
* @return the CfnDataLakeSettings to set the CDK role as Lake Formation admin
*/
export function makeCdkLfAdmin(scope: Construct, id: string): CfnDataLakeSettings {

  // get the CDK execution role
  const stack = Stack.of(scope);
  const synthesizer = stack.synthesizer as DefaultStackSynthesizer;

  // make the CDK execution role a Lake Formation admin
  return grantLfAdminRole(scope, id, Role.fromRoleArn(scope, 'CdkRole', Fn.sub(synthesizer.deployRoleArn)));
}


/**
 * Grant Lake Formation admin role to a principal.
 * @param scope the construct scope
 * @param id the construct id
 * @param principal the IAM Principal to grant Lake Formation admin role. Can be an IAM User, an IAM Role or a SAML identity
 * @return the CfnDataLakeSettings to set the principal as Lake Formation admin
 */
export function grantLfAdminRole(scope: Construct, id: string, principal: IRole|IUser|[ISamlProvider, string]): CfnDataLakeSettings {

  // Check if the principal is an Amazon IAM Role or User and extract the arn and name
  let principalArn: string;
  if ((principal as IRole).roleArn) {
    principalArn = (principal as IRole).roleArn;
  } else if ((principal as IUser).userArn) {
    principalArn = (principal as IUser).userArn;
  } else {
    const samlIdentity = (principal as [ISamlProvider, string]) ;
    principalArn = samlIdentity[0].samlProviderArn + samlIdentity[1];
  }


  return new CfnDataLakeSettings(scope, id, {
    admins: [
      {
        dataLakePrincipalIdentifier: principalArn,
      },
    ],
    mutationType: 'APPEND',
  });
}
