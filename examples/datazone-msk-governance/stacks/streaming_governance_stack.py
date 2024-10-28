from aws_cdk import (
    BundlingOptions,
    CfnParameterProps,
    Duration,
    RemovalPolicy,
    Stack,
    aws_lambda as ldba,
    aws_ec2 as ec2,
    aws_iam as iam,
    aws_emrserverless as emrserverless,
    aws_glue as glue,
    aws_datazone as datazone,
    aws_lambda_python_alpha as python,
    aws_s3_assets as assets,
    DockerImage,
    BundlingOutput,
    aws_kinesisanalyticsv2 as kda,
)
from constructs import Construct
from cdklabs import aws_data_solutions_framework as dsf


class StreamingGovernanceStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, domain_id: str, datazone_portal_role_name: str, environment_id: str ='', **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        stack = Stack.of(self)
        producer_topic = 'producer-data-product'
        consumer_topic = 'consumer-data-product'

        # Set the flag to remove all resources on delete
        self.node.set_context("@data-solutions-framework-on-aws/removeDataOnDestroy", True)

        ### Central components for streaming governance

        msk_asset_type = dsf.governance.DataZoneMskAssetType(self, 
                                            "DataZoneMskAssetType",
                                            domain_id=domain_id,
                                            removal_policy=RemovalPolicy.DESTROY)
        
        central_authorizer = dsf.governance.DataZoneMskCentralAuthorizer(self, 
                                                                         'CentralAuthorizer',
                                                                         domain_id=domain_id,
                                                                         removal_policy=RemovalPolicy.DESTROY)
        
        dsf.governance.DataZoneMskEnvironmentAuthorizer(self, 
                                                        'EnvironmentAuthorizer',
                                                        domain_id=domain_id,
                                                        grant_msk_managed_vpc=True)
        
        ### Components for producer and consumer environments

        vpc = dsf.utils.DataVpc(self, 
                                'EnvironmentsVpc',
                                vpc_cidr='10.0.0.0/16')
        
        default_security_group = ec2.SecurityGroup.from_security_group_id(self, 'DefaultSecurityGroup', vpc.vpc.vpc_default_security_group)
        
        msk_cluster = dsf.streaming.MskServerless(self, "MskServerless",
                                                  cluster_name='serverless-cluster',
                                                  vpc=vpc.vpc,
                                                  subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
                                                  removal_policy=RemovalPolicy.DESTROY)
        
        datazone_portal_role = iam.Role.from_role_name(self, 'DataZonePortalRole', datazone_portal_role_name)
        
        ### Producer environment
        
        msk_cluster.add_topic('ProducerTopic',
                              topic_definition=dsf.streaming.MskTopic(
                                  num_partitions=1,
                                  topic=producer_topic))

        producer_schema_registry = glue.CfnRegistry(self, 'ProducerRegistry', 
                                                    name='producer-registry')
        
        producer_role = iam.Role(self, 'ProducerRole',
                                 assumed_by=iam.ServicePrincipal('lambda.amazonaws.com'),
                                 managed_policies=[iam.ManagedPolicy.from_aws_managed_policy_name('service-role/AWSLambdaBasicExecutionRole')],
                                 inline_policies={
                                    'network': iam.PolicyDocument(
                                        statements=[
                                            iam.PolicyStatement(actions=[
                                                'ec2:CreateNetworkInterface',
                                                'ec2:DescribeNetworkInterfaces',
                                                'ec2:DeleteNetworkInterface'],
                                        resources=['*'])]),
                                    'datazone': iam.PolicyDocument(
                                         statements=[
                                             iam.PolicyStatement(actions=['datazone:PostLineageEvent'],
                                         resources=[f'arn:{stack.partition}:datazone:{stack.region}:{stack.account}:domain/{domain_id}'])]),
                                    'gsr': iam.PolicyDocument(
                                        statements=[
                                            iam.PolicyStatement(
                                                actions=[
                                                    'glue:GetRegistry',
                                                    'glue:CreateRegistry',
                                                    'glue:UpdateRegistry',
                                                    'glue:ListRegistries'],
                                                resources=[producer_schema_registry.attr_arn]),
                                            iam.PolicyStatement(
                                                actions=[
                                                    'glue:CreateSchema',
                                                    'glue:UpdateSchema',
                                                    'glue:GetSchema',
                                                    'glue:ListSchemas',
                                                    'glue:RegisterSchemaVersion',
                                                    'glue:DeleteSchemaVersions',
                                                    'glue:GetSchemaVersion',
                                                    'glue:GetSchemaByDefinition',
                                                    'glue:GetSchemaVersionsDiff',
                                                    'glue:ListSchemaVersions',
                                                    'glue:CheckSchemaVersionValidity',
                                                    'glue:PutSchemaVersionMetadata',
                                                    'glue:RemoveSchemaVersionMetadata',
                                                    'glue:QuerySchemaVersionMetadata',],
                                                resources=['*'])])})
        
        msk_cluster.grant_produce(producer_topic, producer_role)
        
        producer_dz_project = datazone.CfnProject(self, 'ProducerProject', domain_identifier=domain_id, name='producer')

        datazone.CfnProjectMembership(self, 'AdminProducerMembership', 
                                      designation='PROJECT_OWNER', 
                                      domain_identifier=domain_id, 
                                      member=datazone.CfnProjectMembership.MemberProperty(user_identifier=datazone_portal_role.role_arn),
                                      project_identifier=producer_dz_project.attr_id)
        
        dsf.governance.DataZoneGsrMskDataSource(self, 
                                                'ProducerGsrDataSource',
                                                cluster_name=msk_cluster.cluster_name,
                                                domain_id=domain_id,
                                                project_id=producer_dz_project.attr_id,
                                                registry_name=producer_schema_registry.name,
                                                enable_schema_registry_event=True,
                                                removal_policy=RemovalPolicy.DESTROY)
        
        producer_lambda = python.PythonFunction(self, 'ProducerLambda',
                                                entry='./resources/lambda',
                                                runtime=ldba.Runtime.PYTHON_3_9,
                                                index='producer/index.py',
                                                handler='lambda_handler',
                                                # bundling=python.BundlingOptions(asset_excludes=["consumer"]),
                                                vpc=vpc.vpc,
                                                vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
                                                security_groups=[default_security_group],
                                                role=producer_role,
                                                memory_size=512,
                                                timeout=Duration.minutes(15),
                                                environment={
                                                    'KAFKA_CLUSTER_NAME': msk_cluster.cluster_name,
                                                    'KAFKA_AUTH': 'iam',
                                                    'KAFKA_BOOTSTRAP': msk_cluster.cluster_boostrap_brokers,
                                                    'KAFKA_TOPIC': producer_topic,
                                                    'GLUE_REGISTRY_NAME': producer_schema_registry.name,
                                                    'DZ_DOMAIN_ID': domain_id,
                                                })
        
        msk_cluster.broker_security_group.add_ingress_rule(peer=default_security_group, connection=ec2.Port.tcp(9098))

        ### Consumer environment

        consumer_dz_project = datazone.CfnProject(self, 'ConsumerProject', domain_identifier=domain_id, name='consumer')

        datazone.CfnProjectMembership(self, 'AdminConsumerMembership', 
                                      designation='PROJECT_OWNER', 
                                      domain_identifier=domain_id, 
                                      member=datazone.CfnProjectMembership.MemberProperty(user_identifier=datazone_portal_role.role_arn),
                                      project_identifier=consumer_dz_project.attr_id)
                
        # msk_cluster.add_topic('ConsumerTopic',
        #                       topic_definition=dsf.streaming.MskTopic(
        #                           num_partitions=1,
        #                           topic=consumer_topic))
        
        # consumer_schema_registry = glue.CfnRegistry(self, 'ConsumerRegistry', 
        #                                             name='consumer-registry')
        
        # dsf.governance.DataZoneGsrMskDataSource(self, 
        #                                         'ConsumerGsrDataSource',
        #                                         cluster_name=msk_cluster.cluster_name,
        #                                         domain_id=domain_id,
        #                                         project_id=consumer_dz_project.attr_id,
        #                                         registry_name=consumer_schema_registry.name,
        #                                         enable_schema_registry_event=True)

        flink_app_asset = assets.Asset(self, 'FlinkAppAsset',
                                       path="resources/flink",  # Path to the Flink application folder
                                       bundling=BundlingOptions(
                                           image=DockerImage.from_registry('maven:3.8.6-openjdk-11'),  # Maven Docker image
                                           output_type=BundlingOutput.SINGLE_FILE,  # This ensures the jar is copied as-is to the S3 bucket
                                           command=[
                                               'sh',
                                               '-c',
                                               'mvn clean package && cp target/[^original-]*.jar /asset-output/']))

        # consumer_role = dsf.processing.SparkEmrServerlessRuntime.create_execution_role(self, 'ConsumerRole')
        consumer_role = iam.Role(self, 'ConsumerRole',
                                 assumed_by=iam.CompositePrincipal(
                                     iam.ServicePrincipal('kinesisanalytics.amazonaws.com'),
                                    #  iam.ServicePrincipal('emr-serverless.amazonaws.com'),
                                     iam.ServicePrincipal('datazone.amazonaws.com')),
                                 inline_policies={
                                    'consumerPolicy': iam.PolicyDocument(
                                        statements=[
                                             iam.PolicyStatement(
                                                 actions=['datazone:PostLineageEvent'],
                                                 resources=[f'arn:{stack.partition}:datazone:{stack.region}:{stack.account}:domain/{domain_id}']),
                                            #  iam.PolicyStatement(
                                            #      actions=[
                                            #         'glue:GetRegistry',
                                            #         'glue:CreateRegistry',
                                            #         'glue:UpdateRegistry',
                                            #         'glue:ListRegistries'
                                            #     ],
                                            #     resources=[consumer_schema_registry.attr_arn]),
                                             iam.PolicyStatement(
                                                actions=[
                                                    'glue:CreateSchema',
                                                    'glue:UpdateSchema',
                                                    'glue:GetSchema',
                                                    'glue:ListSchemas',
                                                    'glue:RegisterSchemaVersion',
                                                    'glue:DeleteSchemaVersions',
                                                    'glue:GetSchemaVersion',
                                                    'glue:GetSchemaByDefinition',
                                                    'glue:GetSchemaVersionsDiff',
                                                    'glue:ListSchemaVersions',
                                                    'glue:CheckSchemaVersionValidity',
                                                    'glue:PutSchemaVersionMetadata',
                                                    'glue:RemoveSchemaVersionMetadata',
                                                    'glue:QuerySchemaVersionMetadata',],
                                                resources=['*']),
                                             iam.PolicyStatement(
                                                actions=[
                                                    'ec2:DescribeVpcs',
                                                    'ec2:DescribeSubnets',
                                                    'ec2:DescribeSecurityGroups',
                                                    'ec2:DescribeDhcpOptions',
                                                    'ec2:CreateNetworkInterface',
                                                    'ec2:CreateNetworkInterfacePermission',
                                                    'ec2:DescribeNetworkInterfaces',
                                                    'ec2:DeleteNetworkInterface',
                                                ],
                                                resources=['*']),
                                             iam.PolicyStatement(
                                                 actions=[
                                                    's3:GetObject',
                                                    's3:GetObjectVersion'
                                                 ],
                                                 resources=[
                                                     flink_app_asset.bucket.bucket_arn,
                                                     flink_app_asset.bucket.arn_for_objects(flink_app_asset.s3_object_key)
                                                 ]
                                             )])})

        msk_cluster.grant_produce(consumer_topic, consumer_role)
        
        asset_grant = flink_app_asset.bucket.grant_read(identity=consumer_role, objects_key_pattern=flink_app_asset.s3_object_key)
        
        managed_flink_application = kda.CfnApplication(self, 'Managed Flink Application',
                                                       application_name='flink-consumer',
                                                       runtime_environment='FLINK-1_18',
                                                       service_execution_role=consumer_role.role_arn,
                                                       application_configuration=kda.CfnApplication.ApplicationConfigurationProperty(
                                                           application_code_configuration=kda.CfnApplication.ApplicationCodeConfigurationProperty(
                                                               code_content=kda.CfnApplication.CodeContentProperty(
                                                                   s3_content_location=kda.CfnApplication.S3ContentLocationProperty(
                                                                        bucket_arn=f'arn:aws:s3:::{flink_app_asset.s3_bucket_name}',
                                                                        file_key=flink_app_asset.s3_object_key
                                                                       ),
                                                                    ),
                                                                    code_content_type="ZIPFILE"),
                                                            application_snapshot_configuration=kda.CfnApplication.ApplicationSnapshotConfigurationProperty(
                                                                snapshots_enabled=True),
                                                            vpc_configurations=[kda.CfnApplication.VpcConfigurationProperty(
                                                                subnet_ids=vpc.vpc.select_subnets(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS).subnet_ids,
                                                                security_group_ids=[vpc.vpc.vpc_default_security_group])],
                                                            environment_properties=kda.CfnApplication.EnvironmentPropertiesProperty(
                                                                property_groups=[kda.CfnApplication.PropertyGroupProperty(
                                                                    property_group_id="FlinkApplicationProperties",
                                                                    property_map={
                                                                        'bootstrap.servers': msk_cluster.cluster_boostrap_brokers,
                                                                        'source.topic': producer_topic,
                                                                        'sourceClusterName': msk_cluster.cluster_name,
                                                                        'datazoneDomainID': domain_id,
                                                                        'lineageTransport': 'datazone',
                                                                        'region': self.region,
                                                                        'sourceRegistry': producer_schema_registry.name
                                                                    })]),
                                                            flink_application_configuration=kda.CfnApplication.FlinkApplicationConfigurationProperty(
                                                                parallelism_configuration=kda.CfnApplication.ParallelismConfigurationProperty(
                                                                    parallelism=1,
                                                                    configuration_type="CUSTOM",
                                                                    parallelism_per_kpu=1,
                                                                    auto_scaling_enabled=False),
                                                                monitoring_configuration=kda.CfnApplication.MonitoringConfigurationProperty(
                                                                    configuration_type="CUSTOM",
                                                                    metrics_level="APPLICATION",
                                                                    log_level="INFO"))))
                
        # dsf.governance.DataZoneHelpers.create_subscription_target(self, 'ConsumerSubscriptionTarget',
        #                                                           custom_asset_type=msk_asset_type.msk_custom_asset_type,
        #                                                           name='MskTopicsTarget',
        #                                                           provider='dsf',
        #                                                           environment_id=environment_id,
        #                                                           authorized_principals=[consumer_role],
        #                                                           manage_access_role=datazone_portal_role)
