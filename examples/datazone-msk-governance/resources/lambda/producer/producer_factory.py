import yaml
from kafka import KafkaProducer
from aws_msk_iam_sasl_signer import MSKAuthTokenProvider
from openlineage.client import OpenLineageClient
from utils.schema_registry import create_schema_registry_client, create_kafka_serializer, load_avro_schema
from utils.common import emit_event, create_datasets, get_schema_facet, create_openlineage_client
import logging
import uuid
import time
import os
from threading import Thread

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OpenLineageKafkaProducer(KafkaProducer):
    def __init__(self, *args, job_name: str, outputs: list, schema_file_path: str, location: str = None, **kwargs):
        super().__init__(*args, **kwargs)
        self.job_name = job_name
        self.outputs = outputs
        self.location = location
        self.client = create_openlineage_client()
        self.schema_facet = get_schema_facet(schema_file_path)
        self.datasets = create_datasets(self.schema_facet, 'output')  # 'output' for producer
        self.run = str(uuid.uuid4())
        self.job = job_name
        self.started = False  # START event emitted once
        self.completed = False  # COMPLETE event emitted once
        self.running = True  # Control flag for RUNNING events

        # Load schema and initialize serializer
        self.schema = load_avro_schema(schema_file_path)
        self.schema_registry_client = create_schema_registry_client()
        self.serializer = create_kafka_serializer(self.schema_registry_client)

        self.emit_start_event()  # Emit start event once during initialization
        self.running_thread = Thread(target=self._send_running_events)
        self.running_thread.start()

    def emit_start_event(self):
        if not self.started:  # Emit START only if not already emitted
            logger.info(f"Emitting START event for job: {self.job_name}")
            emit_event(self.client, self.run, self.job, 'START', producer="kafka-producer", datasets=self.datasets, dataset_type='output')
            self.started = True

    def _send_running_events(self):
        while self.running:
            emit_event(self.client, self.run, self.job, 'RUNNING', producer="kafka-producer", datasets=self.datasets, dataset_type='output')
            time.sleep(10)

    def send_with_schema(self, topic, data):
        """Serialize data with schema and send it to Kafka."""
        try:
            serialized_data = self.serializer.serialize(topic=topic, value=(data, self.schema))
            self.send(topic, value=serialized_data)
        except Exception as e:
            logger.error(f"Failed to serialize or send data: {e}")

    def close(self, timeout=None):
        """Ensure proper shutdown of the producer and emit COMPLETE event once."""
        self.running = False  # Stop the running thread
        if hasattr(self, 'running_thread') and self.running_thread.is_alive():
            self.running_thread.join()

        if not self.completed:  # Emit COMPLETE only if not already emitted
            logger.info(f"Emitting COMPLETE event for job: {self.job_name}")
            emit_event(self.client, self.run, self.job, 'COMPLETE', producer="kafka-producer", datasets=self.datasets, dataset_type='output')
            self.completed = True

        super().close(timeout=timeout)


class ProducerFactory:
    def __init__(self, auth_type: str, job_name: str, outputs: list, schema_file_path: str, location: str = None):
        self.auth_type = auth_type
        self.job_name = job_name
        self.outputs = outputs
        self.schema_file_path = schema_file_path
        self.location = location
        self.bootstrap_servers = os.environ['KAFKA_BOOTSTRAP']
        self.client_id = 'lambda-producer'
        self.region = os.environ['AWS_REGION']
        self.producer = None

    def _initialize_iam_producer(self):
        logger.info("Initializing IAM authenticated producer...")

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

            # Initialize the Kafka producer with the token provider
            self.producer = OpenLineageKafkaProducer(
                bootstrap_servers=self.bootstrap_servers,
                security_protocol='SASL_SSL',
                sasl_mechanism='OAUTHBEARER',
                sasl_oauth_token_provider=token_provider,  # Token provider handled here
                client_id=self.client_id,
                job_name=self.job_name,
                outputs=self.outputs,
                schema_file_path=self.schema_file_path,
                location=self.location
            )
        except Exception as e:
            logger.error(f"Failed to initialize IAM producer: {e}")

    def _initialize_unauthenticated_producer(self):
        logger.info("Initializing unauthenticated producer...")
        self.producer = OpenLineageKafkaProducer(
            bootstrap_servers=self.bootstrap_servers,
            client_id=self.client_id,
            job_name=self.job_name,
            outputs=self.outputs,
            schema_file_path=self.schema_file_path,
            location=self.location
        )

    def get_producer(self):
        if self.auth_type == 'iam':
            self._initialize_iam_producer()
        else:
            self._initialize_unauthenticated_producer()
        return self.producer
