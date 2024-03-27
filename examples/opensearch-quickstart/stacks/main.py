# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

from aws_cdk import Stack, CfnOutput
from constructs import Construct
import cdklabs.aws_data_solutions_framework as dsf
import os


class OpenSearchStack(Stack):
  def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)

    with open(os.getcwd()+"/stacks/resources/saml_metadata.xml", "r") as f:
      saml_metadata = f.read()

    """
    Create public OpenSearch demo cluster with single data node and SAML authentication using IAM Identity Center.
    See the OpenSearchCluster construct for more details.
    """
    os_cluster = dsf.consumption.OpenSearchCluster(self, 'MyOpenSearchCluster',
      domain_name="mycluster1",
      saml_entity_id='https://portal.sso.us-east-1.amazonaws.com/saml/assertion/NDQ0OTc1NjczNTMwX2lucy01MTRmOGNkNGRjYzJhMjky',
      saml_metadata_content=saml_metadata,
      saml_master_backend_role='4478b4b8-d001-7026-61d3-ad652a11b0db',
      deploy_in_vpc=False,
      data_node_instance_type='t3.small.search',
      data_node_instance_count=1,
      master_node_instance_count=0
    )
    
    
    """
    Add IAMRoleArn as a backend_role to all_access role in the cluster.
    """
    os_cluster.add_role_mapping('AnotherAdmin', 'all_access', 'IAMRoleArn');
    
    """
    Create movies index template.
    See index_template.json for the template definition.
    """
    with open(os.getcwd()+"/stacks/resources/index_template.json", "r") as f:
      index_template = f.read()

    index_template_cr = os_cluster.call_open_search_api('CreateIndexTemplate', '_index_template/movies', index_template)
    
    """
    Use _bulk API to add some documents.
    We explicity add a dependency on index template creation,
    so that the bulk API call will only be executed after the index template is created.
    We also specify POST as the HTTP menthod.
    """
    metadata = '{ "index" : { "_index" : "movies-02"}}';
    bulk = metadata+'\n'
    bulk += '{"title": "Barbie", "year": 2023}\n'
    bulk += metadata+'\n'
    bulk += '{"title": "Openheimer", "year": 2023}\n\n';
    
    bulk_cr = os_cluster.call_open_search_api('AddBulk', '_bulk', bulk, 'POST');
    bulk_cr.node.add_dependency(index_template_cr);

    """
    Add some documents using index API.
    We explicity add a dependency on index template creation
    """
    data1_cr = os_cluster.call_open_search_api('AddData1', 'movies-01/_doc/1111', { "title": "Rush", "year": 2013 }, 'PUT');
    data1_cr.node.add_dependency(index_template_cr);
    data2_cr = os_cluster.call_open_search_api('AddData2', 'movies-01/_doc/2222', { "title": "Toy Story", "year": 2014 }, 'PUT');
    data2_cr.node.add_dependency(index_template_cr);
    data3_cr = os_cluster.call_open_search_api('AddData3', 'movies-01/_doc', { "title": "The Little Mermaid", "year": 2015 }, 'POST');
    data3_cr.node.add_dependency(index_template_cr);
    
    
    CfnOutput(self, "OpensearchDomainEndpoint", value=os_cluster.domain.domain_endpoint)