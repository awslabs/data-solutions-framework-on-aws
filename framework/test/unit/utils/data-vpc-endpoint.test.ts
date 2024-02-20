// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { App, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { DataVpc } from '../../../src/utils';

/**
 * Tests DataVpc construct
 *
 * @group unit/data-vpc-endpoint
 */

describe('With default configuration, the construct ', () => {

  const app = new App();
  const stack = new Stack(app, 'Stack');

  const dataVpc = new DataVpc(stack, 'DataVpc', {
    vpcCidr: '10.0.0.0/16',
    clientVpnEndpointProps: {
      serverCertificateArn: 'arn:aws:acm:us-east-1:XXXXXXXX:certificate/XXXXXXXXXX',
      samlMetadataDocument: `<?xml version="1.0" encoding="UTF-8"?><md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" entityID="https://portal.sso.us-east-1.amazonaws.com/saml/assertion/XXXXXXXXXXXXXX">
        <md:IDPSSODescriptor WantAuthnRequestsSigned="false" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
          <md:KeyDescriptor use="signing">
            <ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
              <ds:X509Data>
                <ds:X509Certificate>XXXXXXXXXXXXXXXXXXXXXXXXX</ds:X509Certificate>
              </ds:X509Data>
            </ds:KeyInfo>
          </md:KeyDescriptor>
          <md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://portal.sso.us-east-1.amazonaws.com/saml/logout/XXXXXXXXXXXXXX"/>
          <md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://portal.sso.us-east-1.amazonaws.com/saml/logout/XXXXXXXXXXXXXX"/>
          <md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat>
          <md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://portal.sso.us-east-1.amazonaws.com/saml/assertion/XXXXXXXXXXXXXX"/>
          <md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://portal.sso.us-east-1.amazonaws.com/saml/assertion/XXXXXXXXXXXXXX"/>
        </md:IDPSSODescriptor>
      </md:EntityDescriptor>`,
    },
  });

  dataVpc.tagVpc('test-tag', 'test-value');

  const template = Template.fromStack(stack);
  //console.log(JSON.stringify(template.toJSON(), null, 2));

  test('should create a client VPN Endpoint with default config', () => {
    template.hasResource('AWS::EC2::ClientVpnEndpoint',
      Match.objectLike({
        Properties: {
          ClientCidrBlock: Match.stringLikeRegexp('10.0.0.0/20'),
          DnsServers: Match.arrayWith(['10.0.0.2']),
          ServerCertificateArn: 'arn:aws:acm:us-east-1:XXXXXXXX:certificate/XXXXXXXXXX',
          SplitTunnel: true,
          TransportProtocol: 'tcp',
          VpnPort: 443,
        },
      }),
    );
  });

  test('should associate to 2 subnets', () => {
    template.resourceCountIs('AWS::EC2::ClientVpnTargetNetworkAssociation', 2);
  });

  test('should have SamlProvider', () => {
    template.resourceCountIs('AWS::IAM::SAMLProvider', 1);
  });

  test('show=uld have authorisation rule', () =>{
    template.resourcePropertiesCountIs('AWS::EC2::ClientVpnAuthorizationRule', {
      AuthorizeAllGroups: true,
    }, 1);
  });

  test('should have security group', () => {
    template.hasResource('AWS::EC2::SecurityGroup',
      Match.objectLike({
        Properties: Match.objectLike({
          GroupDescription: 'Stack/vpnSecurityGroup',
          SecurityGroupIngress: Match.arrayWith([
            Match.objectLike({
              FromPort: 443,
              IpProtocol: 'tcp',
              ToPort: 443,
            }),
          ]),
        }),
      }));
  });


  test('should create a log group for VPN Endpoint with 7 days retention and RETAIN removal policy', () => {
    template.hasResource('AWS::Logs::LogGroup', {
      Properties: Match.objectLike({
        RetentionInDays: 7,
      }),
      UpdateReplacePolicy: 'Retain',
      DeletionPolicy: 'Retain',
    });
  });
});

