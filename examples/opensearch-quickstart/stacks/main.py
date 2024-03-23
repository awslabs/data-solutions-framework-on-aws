# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

from aws_cdk import Stack, RemovalPolicy, CfnOutput
from aws_cdk.aws_iam import Policy, PolicyStatement
from aws_cdk.aws_kms import Key
from constructs import Construct
from aws_cdk.aws_s3 import Bucket
import cdklabs.aws_data_solutions_framework as dsf


class OpenSearchStack(Stack):
  def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)

    os_cluster = dsf.consumption.OpenSearchCluster(self, 'MyOpenSearchCluster',
      domain_name="mycluster1",
      saml_entity_id='https://portal.sso.us-east-1.amazonaws.com/saml/assertion/NDQ0OTc1NjczNTMwX2lucy01MTRmOGNkNGRjYzJhMjky',
      saml_metadata_content=f"""<?xml version="1.0" encoding="UTF-8"?><md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" entityID="https://portal.sso.us-east-1.amazonaws.com/saml/assertion/NDQ0OTc1NjczNTMwX2lucy01MTRmOGNkNGRjYzJhMjky">
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
          </md:EntityDescriptor>""",
      saml_master_backend_role='4478b4b8-d001-7026-61d3-ad652a11b0db',
      deploy_in_vpc=False,
      data_node_instance_type='t3.small.search',
      data_node_instance_count=1,
      master_node_instance_count=0
    )
    os_cluster.call_open_search_api('CreateIndexTemplate', '_index_template/movies', 
    {
      "index_patterns": [
          "movies-*"
      ],
      "template": {
          "settings": {
              "index": {
                  "number_of_shards": 1,
                  "number_of_replicas": 0
              }
          },
          "mappings": {
              "properties": {
                  "title": {
                      "type": "text"
                  },
                  "year": {
                      "type": "integer"
                  }
              }
          }
      }
    })
    metadata = '{ "index" : { "_index" : "movies-02"}}';
    bulk = f"""${metadata}
    {"title": "Barbie", "year": 2023}
    ${metadata}
    {"title": "Openheimer", "year": 2023}""";
    os_cluster.add_role_mapping('AnotherAdmin', 'all_access', ['sometestId']);
    os_cluster.call_open_search_api('AddBulk', '_bulk', bulk + '\n\n', 'POST');
    os_cluster.call_open_search_api('AddData1', 'movies-01/_doc/1111', { "title": "Rush", "year": 2013 }, 'PUT');
    os_cluster.call_open_search_api('AddData3', 'movies-01/_doc/2222', { "title": "Toy Story", "year": 2014 }, 'PUT');
    os_cluster.call_open_search_api('AddData4', 'movies-01/_doc', { "title": "The Little Mermaid", "year": 2015 }, 'POST');
    
    
    CfnOutput(self, "OpensearchDomainEndpoint", value=os_cluster.domain.domain_endpoint)