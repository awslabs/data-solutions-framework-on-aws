from aws_schema_registry import SchemaRegistryClient, Schema
from aws_schema_registry.adapter.kafka import KafkaSerializer
from aws_schema_registry.avro import AvroSchema
from openlineage.client.facet import SchemaDatasetFacet, SchemaField
import boto3
import json
import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def load_avro_schema(schema_file_path: str) -> AvroSchema:
    """Load Avro schema from a given file path."""
    with open(schema_file_path, 'r') as schema_file:
        schema_definition = json.load(schema_file)
    return AvroSchema(schema_definition)

def get_schema_from_glue(schema_name: str, schema_version: str = None) -> SchemaDatasetFacet:
    """Fetch schema from AWS Glue Schema Registry."""
    glue_client = boto3.client('glue', region_name=os.environ['AWS_REGION'])

    try:
        version_number = {'LatestVersion': True} if schema_version is None else {'VersionNumber': schema_version}

        logger.info(f"Fetching schema version for '{schema_name}' with version: {version_number}")

        response = glue_client.get_schema_version(
            SchemaId={
                'SchemaName': schema_name,
                'RegistryName': os.environ['GLUE_REGISTRY_NAME']
            },
            SchemaVersionNumber=version_number
        )

        schema_definition = json.loads(response['SchemaDefinition'])
        fields = [{"name": field["name"], "type": field["type"]} for field in schema_definition['fields']]
        return SchemaDatasetFacet(fields=[SchemaField(name=field['name'], type=field['type']) for field in fields])

    except glue_client.exceptions.EntityNotFoundException:
        logger.error(f"Schema '{schema_name}' not found in registry.")
        return None
    except Exception as e:
        logger.error(f"Error retrieving schema: {e}")
        return None

def create_schema_registry_client() -> SchemaRegistryClient:
    region = os.environ['AWS_REGION']
    registry_name = os.environ['GLUE_REGISTRY_NAME']
    glue_client = boto3.client('glue', region_name=region)
    logger.info(f"Starting Glue client")
    return SchemaRegistryClient(glue_client, registry_name=registry_name)

class CustomTopicNameStrategy:
    def __call__(self, topic: str, is_key: bool, schema: Schema) -> str:
        return topic

def create_kafka_serializer(client: SchemaRegistryClient) -> KafkaSerializer:
    """Create Kafka serializer using custom naming strategy."""
    custom_strategy = CustomTopicNameStrategy()
    return KafkaSerializer(client, schema_naming_strategy=custom_strategy)