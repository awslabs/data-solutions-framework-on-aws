# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

from aws_cdk import (
    # Duration,
    RemovalPolicy,
    Stack,
)
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
        dsf.utils.S3DataCopy(self,
                             'SourceData', 
                             source_bucket=source_bucket, 
                             source_bucket_prefix='data/customer/', 
                             source_bucket_region='us-west-2', 
                             target_bucket=data_lake.bronze_bucket, 
                             target_bucket_prefix='customer/'
                             )

        """Create an IAM role for Redshift to access the data lake and grant permissions
        """
        lake_role = Role(self, 'LakeRole', assumed_by=ServicePrincipal('redshift.amazonaws.com'))
        data_lake.bronze_bucket.grant_read(lake_role)
        data_lake.silver_bucket.grant_read_write(lake_role)
        data_lake.gold_bucket.grant_read(lake_role)
        data_catalog.gold_catalog_database.grant_read_only_access(lake_role)

        """Create a Redshift Serverless namespace and workgroup
        """
        namespace = dsf.consumption.RedshiftServerlessNamespace(self, 
                                                                'Namespace', 
                                                                db_name='defaultdb', 
                                                                name='test-namespace', 
                                                                removal_policy=RemovalPolicy.DESTROY, 
                                                                default_iam_role=lake_role
                                                                )
        
        workgroup = dsf.consumption.RedshiftServerlessWorkgroup(self, 
                                                                'Workgroup', 
                                                                name='test-workgroup', 
                                                                namespace=namespace, 
                                                                removal_policy=RemovalPolicy.DESTROY
                                                                ) 
    
        """Run a SQL script to create a table in the database
        """
        customer_create = workgroup.run_custom_sql('CustomerCreate', 
                                                   database_name='defaultdb', 
                                                   sql='''create table customer (
                                                            C_CUSTKEY bigint NOT NULL,
                                                            C_NAME varchar(25),
                                                            C_ADDRESS varchar(40),
                                                            C_NATIONKEY bigint,
                                                            C_PHONE varchar(15),
                                                            C_ACCTBAL decimal(18,4),
                                                            C_MKTSEGMENT varchar(10),
                                                            C_COMMENT varchar(117)
                                                          )''',
                                                   delete_sql='''drop table customer'''
                                                   )
        
        """Run a SQL script to load data into the customer table
        """
        customer_load = workgroup.ingest_data('CustomerLoad',
                                              database_name='defaultdb',
                                              target_table='customer',
                                              source_bucket=data_lake.bronze_bucket, 
                                              source_prefix='customer',
                                              ingest_additional_options='lzop delimiter \'|\' COMPUPDATE PRESET')
        
        """Ensure ordering and dependencies between SQL queries
        """
        customer_load.node.add_dependency(customer_create)

        """Create a Glue Catalog table for the customer data using a Glue crawler
        """
        workgroup.catalog_tables('DefaultDBCatalog', 'redshift_defaultdb')

        """Create a data sharing for the customer table
        """
        data_share = workgroup.create_share('DataSharing', 'defaultdb', 'defaultdbshare', 'public', ['customer'])


        namespace2 = dsf.consumption.RedshiftServerlessNamespace(self,
                                                                 "Namespace2",
                                                                 db_name="defaultdb",
                                                                 name="default2",
                                                                 default_iam_role=lake_role,
                                                                 removal_policy=RemovalPolicy.DESTROY
                                                                 )

        workgroup2 = dsf.consumption.RedshiftServerlessWorkgroup(self,
                                                                 "Workgroup2",
                                                                 name="default2",
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
            "tpcds",
            data_share.data_share_name,
            data_share.producer_namespace
        )
        create_db_from_share.resource.node.add_dependency(share_grant.resource)
        create_db_from_share.resource.node.add_dependency(workgroup2)