from consumer_factory import ConsumerFactory
import logging
from common import load_config

def lambda_handler(event, context):
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

    config = load_config()
    auth_type = config['kafka']['authentication']

    # No need to manually specify job_name, it will now come from the group_id in config
    factory = ConsumerFactory(auth_type=auth_type)
    consumer = factory.get_consumer()

    logger.info("Consumer initialized and starting to consume messages.")

    try:
        for message in consumer:
            # The deserializer produces DataAndSchema instances
            data, schema = message.value
            print(data)
    except Exception as e:
        logger.error(f"An error occurred: {e}")
    finally:
        consumer.close()

if __name__ == "__main__":
    lambda_handler()