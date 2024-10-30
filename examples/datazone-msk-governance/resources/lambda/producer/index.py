from producer.producer_factory import ProducerFactory
import os

def lambda_handler(event, context):

    auth_type = os.environ['KAFKA_AUTH']
    job_name = 'producer-job'
    schema_file_path = 'user.avsc'
    outputs = []
    topic = os.environ['KAFKA_TOPIC']

    # Create the producer factory (no need to handle token provider here)
    producer_factory = ProducerFactory(auth_type, job_name, outputs, schema_file_path)
    producer = producer_factory.get_producer()

    names = ['Francisco Doe', 'Jane Smith', 'John Doe', 'John Wick']
    favorite_numbers = [6, 7, 42, 10, 56, 12, 35, 78, 40]

    try:
        for name in names:
            for number in favorite_numbers:
                data = {'name': name, 'favorite_number': number}
                producer.send_with_schema(topic, data)
                print(f"Sent data: {data}")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        producer.close()

if __name__ == "__main__":
    lambda_handler()
