// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * E2E test for OpenSearch
 *
 * @group e2e/consumption/opensearch-api
 */


import { App, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';

import { TestStack } from './test-stack';
import { OpenSearchCluster } from '../../src/consumption/index';


jest.setTimeout(10000000);

// GIVEN
const app = new App();
const testStack = new TestStack('OpenSearchApiTestStack', app);
const { stack } = testStack;
stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

const domain = new OpenSearchCluster(stack, 'OpenSearchVpc', {
  domainName: 'e2e-tests-cluster',
  samlEntityId: 'https://portal.sso.eu-west-1.amazonaws.com/saml/assertion/MTQ1Mzg4NjI1ODYwX2lucy02MmQ3Y2VlYWM0YWNkNjA1',
  samlMetadataContent: `<?xml version="1.0" encoding="UTF-8"?><md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" entityID="https://portal.sso.eu-west-1.amazonaws.com/saml/assertion/MTQ1Mzg4NjI1ODYwX2lucy02MmQ3Y2VlYWM0YWNkNjA1">
  <md:IDPSSODescriptor WantAuthnRequestsSigned="false" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:KeyDescriptor use="signing">
      <ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
        <ds:X509Data>
          <ds:X509Certificate>MIIDBzCCAe+gAwIBAgIFAMWCViwwDQYJKoZIhvcNAQELBQAwRTEWMBQGA1UEAwwNYW1hem9uYXdzLmNvbTENMAsGA1UECwwESURBUzEPMA0GA1UECgwGQW1hem9uMQswCQYDVQQGEwJVUzAeFw0yNDAyMjExNTQ4MTJaFw0yOTAyMjExNTQ4MTJaMEUxFjAUBgNVBAMMDWFtYXpvbmF3cy5jb20xDTALBgNVBAsMBElEQVMxDzANBgNVBAoMBkFtYXpvbjELMAkGA1UEBhMCVVMwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDHco1Vg9SeXOJHv4CEbY7folO9+zP3naA570q97Oi9o81l9ibP5c+a1404qUBuv5E4HH1chtHU6Yos5LMXHaRet/bOUBrAIOieF0RCMLfHz1Vkf213SWf60yfAA19QgwQRLH3HTEc+nhfe93RAgcw1T7mZBcHk5Zljt6gShq3N4YzupO4KpuRBX2S2XzfhasuDV8JpcB6BGexTDzAEcZ1P0v8X+vpCF7fN9Gd5K/rrOtCuPcSC694KJgfOucvMNj7PqpkLvLzTosxlqL6P5PQheW5sZwYqvw+MJrGIg5WBqRXoTF0JE5A6lv1aWhQDfuyzQ8UojGeMjTwgz1/PTQGFAgMBAAEwDQYJKoZIhvcNAQELBQADggEBADWTz+ggtrkhDGYKqEqFn04s0fMhfcQ9f6j0Rs8igysdINM7VCyD4PJapn5kekKwlzir27t9fpCD+PcgiCAKxGnaTvaKSTfoyGvHnRYhTbjb+XougPyyTl5qdJZkXx0x6ucw6OjbF/WH2VLY1xvr9MQkbUWNcS9b2FDIujHs881hpITPIKadV42BbIAK5sRJTncykJ6KSdN/MGVwYYVrE2rAM1uubwcKLkmbGxDBiS7ci3gu0M+5A53WHrjeGR/JC6ER49ybGYjouEKJWRw8ixRLV03H1kdrveuV4CUdv/mUJLzHulHWEGZFrvJIrQjf0ORYb790AAjBg092tlwg2Ys=</ds:X509Certificate>
        </ds:X509Data>
      </ds:KeyInfo>
    </md:KeyDescriptor>
    <md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://portal.sso.eu-west-1.amazonaws.com/saml/logout/MTQ1Mzg4NjI1ODYwX2lucy02MmQ3Y2VlYWM0YWNkNjA1"/>
    <md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://portal.sso.eu-west-1.amazonaws.com/saml/logout/MTQ1Mzg4NjI1ODYwX2lucy02MmQ3Y2VlYWM0YWNkNjA1"/>
    <md:NameIDFormat/>
    <md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://portal.sso.eu-west-1.amazonaws.com/saml/assertion/MTQ1Mzg4NjI1ODYwX2lucy02MmQ3Y2VlYWM0YWNkNjA1"/>
    <md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://portal.sso.eu-west-1.amazonaws.com/saml/assertion/MTQ1Mzg4NjI1ODYwX2lucy02MmQ3Y2VlYWM0YWNkNjA1"/>
  </md:IDPSSODescriptor>
</md:EntityDescriptor>`,
  samlMasterBackendRole: 'admin',
  deployInVpc: false,
  removalPolicy: RemovalPolicy.DESTROY,
});


const cr = domain.addRoleMapping('DashboardOsUser', 'dashboards_user', '<IAMIdentityCenterDashboardUsersGroupId>');

new CfnOutput(stack, 'OpenSearchApiCr', {
  value: cr.toString(),
});


let deployResult: Record<string, string>;

beforeAll(async() => {
  // WHEN
  deployResult = await testStack.deploy();
}, 10000000);

it('Custom resource created successfully', async () => {
  // THEN
  expect(deployResult.OpenSearchApiCr).toContain('OpenSearchApiTestStack');
});

afterAll(async () => {
  await testStack.destroy();
}, 10000000);
