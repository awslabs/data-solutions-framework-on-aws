import logging
from kafka import KafkaConsumer
from aws_schema_registry import SchemaRegistryClient
from aws_schema_registry.adapter.kafka import KafkaDeserializer
from utils.schema_registry import create_schema_registry_client, get_schema_from_glue
from utils.common import load_config, create_openlineage_client, emit_event, create_datasets
import boto3
import uuid
import time
from threading import Thread
from aws_msk_iam_sasl_signer import MSKAuthTokenProvider

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OpenLineageKafkaConsumer(KafkaConsumer):
    def __init__(self, *args, consumer_group: str, **kwargs):
        config = load_config()
        topic = config['kafka']['topic']
        cluster_name = config['kafka']['cluster_name']

        # Create the schema registry client
        glue_client = boto3.client('glue', region_name=config['gsr']['region'])
        schema_registry_client = SchemaRegistryClient(glue_client, registry_name=config['gsr']['registry_name'])

        # Create deserializer
        deserializer = KafkaDeserializer(schema_registry_client)

        # Create KafkaConsumer with deserializer
        super().__init__(*args, value_deserializer=deserializer, **kwargs)

        self.job_name = consumer_group  # Use the consumer group as the job name
        self.client = create_openlineage_client()
        self.run = str(uuid.uuid4())
        self.started = False
        self.running = True
        self.subscribe([topic])

        # Fetch schema facet from Glue Schema Registry
        self.schema_name = topic  # Assuming schema name is the same as the topic
        self.schema_facet = get_schema_from_glue(self.schema_name)

        # Initialize datasets
        if self.schema_facet:
            self.datasets = create_datasets(self.schema_facet, 'input')
        else:
            logger.error(f"Schema facet is not available for topic '{self.schema_name}'.")
            self.datasets = []

        self.emit_start_event()
        self.running_thread = Thread(target=self._send_running_events)
        self.running_thread.start()

    def emit_start_event(self):
        if not self.started:
            logger.info(f"Emitting START event for job: {self.job_name}")
            emit_event(self.client, self.run, self.job_name, 'START', 'kafka-consumer', [], 'input')
            self.started = True

    def _send_running_events(self):
        """Periodically emit RUNNING events while the consumer is active."""
        while self.running:
            try:
                emit_event(self.client, self.run, self.job_name, 'RUNNING', 'kafka-consumer', self.datasets, 'input')
            except Exception as e:
                logger.error(f"Error processing message: {e}")
            time.sleep(10)

    def close(self):
        self.running = False
        if hasattr(self, 'running_thread') and self.running_thread.is_alive():
            self.running_thread.join()

        logger.info(f"Emitting COMPLETE event for job: {self.job_name}")
        emit_event(self.client, self.run, self.job_name, 'COMPLETE', 'kafka-consumer', [], 'input')

        super().close()

class ConsumerFactory:
    def __init__(self, auth_type: str):
        self.auth_type = auth_type
        self.config = load_config()
        self.bootstrap_servers = self.config['kafka']['bootstrap_servers']
        self.client_id = self.config['kafka']['client_id']
        self.region = self.config['gsr']['region']

        self.consumer_group = self.config['kafka']['group_id']  # Pass consumer group from config
        self.offset_reset = self.config['kafka'].get('auto_offset_reset', 'latest')  # Offset reset from config

        self.consumer = None

    def _initialize_iam_consumer(self):
        try:
            # Define MSK Token Provider inside the factory
            class MSKTokenProvider:
                def __init__(self, region):
                    self.region = region

                def token(self):
                    token, _ = MSKAuthTokenProvider.generate_auth_token(self.region)
                    return token

            # Initialize MSK Token Provider
            token_provider = MSKTokenProvider(self.region)

            self.consumer = OpenLineageKafkaConsumer(
                bootstrap_servers=self.bootstrap_servers,
                security_protocol='SASL_SSL',
                sasl_mechanism='OAUTHBEARER',
                sasl_oauth_token_provider=token_provider,
                client_id=self.client_id,
                consumer_group=self.consumer_group,  # Pass consumer group as job name
                auto_offset_reset=self.offset_reset,  # Offset reset from config
                enable_auto_commit=True,
                group_id=self.consumer_group
            )
        except Exception as e:
            logger.error(f"Error initializing IAM consumer: {e}")

    def _initialize_unauthenticated_consumer(self):
        logger.info("Initializing unauthenticated consumer...")
        self.consumer = OpenLineageKafkaConsumer(
            bootstrap_servers=self.bootstrap_servers,
            auto_offset_reset=self.offset_reset,  # Offset reset from config
            enable_auto_commit=True,
            client_id=self.client_id,
            consumer_group=self.consumer_group,  # Pass consumer group as job name
            group_id=self.consumer_group
        )

    def get_consumer(self):
        if self.auth_type == 'iam':
            self._initialize_iam_consumer()
        else:
            self._initialize_unauthenticated_consumer()
        return self.consumer