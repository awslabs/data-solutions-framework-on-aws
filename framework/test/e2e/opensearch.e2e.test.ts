// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * E2E test for OpenSearch
 *
 * @group e2e/consumption/opensearch
 */


import { App, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';

import { TestStack } from './test-stack';
import { OpensearchCluster } from '../../src/consumption/index';


jest.setTimeout(10000000);

// GIVEN
const app = new App();
const testStack = new TestStack('OpenSearchTestStack', app);
const { stack } = testStack;
stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

// Instantiate AccessLogsBucket Construct with default
const domain = new OpensearchCluster(stack, 'OpensearchVpc', {
  domainName: 'mycluster2',
  samlEntityId: 'https://portal.sso.us-east-1.amazonaws.com/saml/metadata/NDQ0OTc1NjczNTMwX2lucy01MTRmOGNkNGRjYzJhMjky',
  samlMetadataContent: `<?xml version="1.0" encoding="UTF-8"?><md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" entityID="https://portal.sso.us-east-1.amazonaws.com/saml/assertion/NDQ0OTc1NjczNTMwX2lucy01MTRmOGNkNGRjYzJhMjky">
<md:IDPSSODescriptor WantAuthnRequestsSigned="false" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
  <md:KeyDescriptor use="signing">
    <ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
      <ds:X509Data>
        <ds:X509Certificate>MIIDBzCCAe+gAwIBAgIFAJRn/1owDQYJKoZIhvcNAQELBQAwRTEWMBQGA1UEAwwNYW1hem9uYXdzLmNvbTENMAsGA1UECwwESURBUzEPMA0GA1UECgwGQW1hem9uMQswCQYDVQQGEwJVUzAeFw0yNDAxMDMxNDI3MjVaFw0yOTAxMDMxNDI3MjVaMEUxFjAUBgNVBAMMDWFtYXpvbmF3cy5jb20xDTALBgNVBAsMBElEQVMxDzANBgNVBAoMBkFtYXpvbjELMAkGA1UEBhMCVVMwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC4njhO6vSqfZy+oO3NwUAOiXg/y4053BvSGQIBn/QTiQnSwitQ8gDwnbFs7O65fs+JBEx+L7/4qRkNVGvI9CmF/bCWGqK6OFxUqeA9Ex+8Q42RonnruD+WloniQyDWEs6UR1x+RAFoCFMY28Xvhse1GwV8N+kg20sH3nzHo0Z7B+pRJqflY0/B2dQV8QE/fkJ2EnwLpaxbfsPVYt9pba0GK7xtiXJYzfl4kJ7eb5P0mtNeUHvMZQ786OmykABZVUMLx07po2oMXWxVw0OwoXPj3ijpa4odNRzJt65UAGsqnP45oHYO0FB+GqcVj1Iva2zYcq+4yu1UWXkY/Nf/k2u7AgMBAAEwDQYJKoZIhvcNAQELBQADggEBAEL2rJc6U7vNoq3gMVmfA2U/TqUMq3owcIrpI3YnXBspvKHpXzgHhht3PW1JPujLopszf3/txckzqvysLIlvNV2ZF4ecoHhq7cBkc5/KpR265N8XVJ9JjLV5mCDaDj0PcaRYdiMI0n/PDuHTrUT/WoYxZ29JSBVa0SB8rIJAlB6ffusxs1Kpq3NzewsVe9Jv3c+Y04G4A2NXJ2DZlEzPzAOJYXOLcrd4TVABAIsbU1Oek8UWn70I65Knp8kA/JunwJtpfLwHfH31l8A/yUsjU1+9hSci7O8cqy0+E7Xn+Tif0bE3YUO2kSMc5bkvv+Da4RqzblIQSCi5g2TgWAoNg8o=</ds:X509Certificate>
      </ds:X509Data>
    </ds:KeyInfo>
  </md:KeyDescriptor>
  <md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://portal.sso.us-east-1.amazonaws.com/saml/logout/NDQ0OTc1NjczNTMwX2lucy01MTRmOGNkNGRjYzJhMjky"/>
  <md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://portal.sso.us-east-1.amazonaws.com/saml/logout/NDQ0OTc1NjczNTMwX2lucy01MTRmOGNkNGRjYzJhMjky"/>
  <md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat>
  <md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://portal.sso.us-east-1.amazonaws.com/saml/assertion/NDQ0OTc1NjczNTMwX2lucy01MTRmOGNkNGRjYzJhMjky"/>
  <md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://portal.sso.us-east-1.amazonaws.com/saml/assertion/NDQ0OTc1NjczNTMwX2lucy01MTRmOGNkNGRjYzJhMjky"/>
</md:IDPSSODescriptor>
</md:EntityDescriptor>`,
  samlMasterBackendRole: 'IdpGroupId',
  deployInVpc: true,
  removalPolicy: RemovalPolicy.DESTROY,
});


new CfnOutput(stack, 'OpenSearchArn', {
  value: domain.domain.domainArn,
});

new CfnOutput(stack, 'masterRoleArn', {
  value: domain.masterRole.roleArn,
});

new CfnOutput(stack, 'vpcArn', {
  value: domain.vpc!.vpcArn,
});


let deployResult: Record<string, string>;

beforeAll(async() => {
  // WHEN
  deployResult = await testStack.deploy();
}, 10000000);

it('Containers runtime created successfully', async () => {
  // THEN
  expect(deployResult.OpenSearchArn).toContain('arn');
  expect(deployResult.masterRoleArn).toContain('arn');
  expect(deployResult.vpcArn).toContain('arn');
});

afterAll(async () => {
  await testStack.destroy();
}, 10000000);
