# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

from aws_cdk import (
    # Duration,
    RemovalPolicy,
    Stack,
    Aws
)
from aws_cdk.custom_resources import AwsCustomResource, AwsSdkCall, PhysicalResourceId, AwsCustomResourcePolicy
from aws_cdk.aws_s3 import Bucket
from aws_cdk.aws_iam import Role, ServicePrincipal
from constructs import Construct
from cdklabs import aws_data_solutions_framework as dsf


class RedshiftStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        stack = Stack.of(self)
        self.node.set_context("@data-solutions-framework-on-aws/removeDataOnDestroy", True)
       
        """Create a Data Lake with a Data Catalog to store data.
        """
        data_lake = dsf.storage.DataLakeStorage(self, 
                                                'DataLake', 
                                                removal_policy=RemovalPolicy.DESTROY
                                                )

        data_catalog = dsf.governance.DataLakeCatalog(self, 
                                                      'DataCatalog', 
                                                      data_lake_storage=data_lake, 
                                                      removal_policy=RemovalPolicy.DESTROY
                                                      )

        """Copy some reference data from a public bucket in the Data Lake bronze layer
        """
        source_bucket = Bucket.from_bucket_name(self, 
                                                'SourceBucket', 
                                                bucket_name='redshift-immersionday-labs'
                                                )  
        data_copy = dsf.utils.S3DataCopy(self,
                             'SourceData', 
                             source_bucket=source_bucket, 
                             source_bucket_prefix='data/amazon-reviews/', 
                             source_bucket_region='us-west-2', 
                             target_bucket=data_lake.silver_bucket,
                             target_bucket_prefix='silver/amazon-review/'
                             )
        
        trigger_silver_crawler = AwsCustomResource(self, 
                                                   "TriggerSilverCrawler",
                                                   on_update=AwsSdkCall(service="Glue",
                                                                        action="startCrawler",
                                                                        parameters={
                                                                            "Name": data_catalog.silver_catalog_database.crawler.name,
                                                                        },
                                                                        physical_resource_id=PhysicalResourceId.of(Aws.STACK_ID)
                                                                        ),
                                                   policy=AwsCustomResourcePolicy.from_sdk_calls(
                                                       resources=[f'arn:{Aws.PARTITION}:glue:{Aws.REGION}:{Aws.ACCOUNT_ID}:crawler/{data_catalog.silver_catalog_database.crawler.name}'],
                                                   ))

        trigger_silver_crawler.node.add_dependency(data_copy)

        """Create an IAM role for Redshift to access the data lake and grant permissions
        """
        lake_role = Role(self, 'LakeRole', assumed_by=ServicePrincipal('redshift.amazonaws.com'))
        data_lake.silver_bucket.grant_read(lake_role)
        data_catalog.silver_catalog_database.grant_read_only_access(lake_role)

        """Create a Redshift Serverless namespace and workgroup
        """
        namespace = dsf.consumption.RedshiftServerlessNamespace(self, 
                                                                'Namespace', 
                                                                db_name='defaultdb', 
                                                                name='producer', 
                                                                removal_policy=RemovalPolicy.DESTROY, 
                                                                default_iam_role=lake_role
                                                                )
        
        workgroup = dsf.consumption.RedshiftServerlessWorkgroup(self, 
                                                                'Workgroup', 
                                                                name='producer', 
                                                                namespace=namespace, 
                                                                removal_policy=RemovalPolicy.DESTROY
                                                                ) 
    
        """Run a custom SQL to mount the Glue Data Catalog silver DB
        """
        data_lake_mount = workgroup.run_custom_sql('MountDataLake', 
                                                   database_name='defaultdb', 
                                                   sql=f'''
                                                        create external schema silver 
                                                        from data catalog database '{data_catalog.silver_catalog_database.database_name}' 
                                                        iam_role default
                                                        catalog_id '{Aws.ACCOUNT_ID}'
                                                   ''',
                                                   delete_sql='drop external schema silver cascade'
                                                   )
        
        """Run a SQL script to create the gold layer using an incremental MV from the Data Lake
        """
        materialized_view = workgroup.run_custom_sql('MvProductAnalysis',
                                                     database_name='defaultdb', 
                                                     sql=f'''CREATE MATERIALIZED VIEW mv_product_analysis
                                                            AS
                                                            SELECT review_date,
                                                                product_title,
                                                                COUNT(1) AS review_total,
                                                                SUM(star_rating) AS rating
                                                            FROM silver.amazon_review
                                                            WHERE marketplace = 'US'
                                                            GROUP BY 1,2;''',
                                                     delete_sql='drop materialized view mv_product_analysis'
                                                     )
        
        """Ensure ordering and dependencies between SQL queries
        """
        materialized_view.node.add_dependency(data_lake_mount)

        refresh_mv = workgroup.run_custom_sql('RefreshMvProductAnalysis',
                                             database_name='defaultdb',
                                             sql=f'''REFRESH MATERIALIZED VIEW mv_product_analysis''',
                                             )
        refresh_mv.node.add_dependency(materialized_view)

        """Create a Glue Catalog table for the materialized view data using a Glue crawler
        """
        workgroup.catalog_tables('DefaultDBCatalog', 'mv_product_analysis')

        """Create a data sharing for the customer table
        """
        data_share = workgroup.create_share('DataSharing', 'defaultdb', 'defaultdbshare', 'public', ['mv_product_analysis'])


        namespace2 = dsf.consumption.RedshiftServerlessNamespace(self,
                                                                 "Namespace2",
                                                                 db_name="defaultdb",
                                                                 name="consumer",
                                                                 default_iam_role=lake_role,
                                                                 removal_policy=RemovalPolicy.DESTROY
                                                                 )

        workgroup2 = dsf.consumption.RedshiftServerlessWorkgroup(self,
                                                                 "Workgroup2",
                                                                 name="consumer",
                                                                 namespace=namespace2,
                                                                 removal_policy=RemovalPolicy.DESTROY
                                                                 )

        share_grant = workgroup.grant_access_to_share("GrantToSameAccount",
                                                            data_share,
                                                            namespace2.namespace_id
                                                            )
        
        share_grant.resource.node.add_dependency(data_share.new_share_custom_resource)
        share_grant.resource.node.add_dependency(namespace2)

        create_db_from_share = workgroup2.create_database_from_share(
            "CreateDatabaseFromShare",
            "marketing",
            data_share.data_share_name,
            data_share.producer_namespace
        )
        create_db_from_share.resource.node.add_dependency(share_grant.resource)
        create_db_from_share.resource.node.add_dependency(workgroup2)