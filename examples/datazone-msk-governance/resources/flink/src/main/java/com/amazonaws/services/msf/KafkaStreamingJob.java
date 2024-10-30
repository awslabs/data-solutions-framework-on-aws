package com.amazonaws.services.msf;

import com.amazonaws.services.kinesisanalytics.runtime.KinesisAnalyticsRuntime;
import com.amazonaws.services.msf.avro.RoomTemperature;
import com.amazonaws.services.msf.avro.User;
import com.amazonaws.services.schemaregistry.utils.AWSSchemaRegistryConstants;
import com.amazonaws.services.schemaregistry.utils.AvroRecordType;
import com.esotericsoftware.minlog.Log;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.openlineage.flink.OpenLineageFlinkJobListener;
import io.openlineage.flink.shaded.org.yaml.snakeyaml.Yaml;
import org.apache.avro.specific.SpecificRecord;
import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.api.common.functions.MapFunction;
import org.apache.flink.api.common.serialization.DeserializationSchema;
import org.apache.flink.api.common.serialization.SerializationSchema;
import org.apache.flink.api.java.functions.KeySelector;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.api.java.utils.ParameterTool;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.configuration.ConfigurationUtils;
import org.apache.flink.connector.kafka.sink.KafkaRecordSerializationSchema;
import org.apache.flink.connector.kafka.sink.KafkaSink;
import org.apache.flink.connector.kafka.source.KafkaSource;
import org.apache.flink.connector.kafka.source.enumerator.initializer.OffsetsInitializer;
import org.apache.flink.connector.kafka.source.reader.deserializer.KafkaRecordDeserializationSchema;
import org.apache.flink.core.execution.JobListener;
import org.apache.flink.formats.avro.glue.schema.registry.GlueSchemaRegistryAvroDeserializationSchema;
import org.apache.flink.formats.avro.glue.schema.registry.GlueSchemaRegistryAvroSerializationSchema;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.LocalStreamEnvironment;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.windowing.assigners.TumblingProcessingTimeWindows;
import org.apache.flink.streaming.api.windowing.time.Time;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;


public class KafkaStreamingJob {

    private static final String DEFAULT_SOURCE_TOPIC = "temperature-samples";
    private static final String DEFAULT_SINK_TOPIC = "room-temperatures";
    private static final String DEFAULT_CLUSTER = "localhost:9092";
    private static final String DEFAULT_REGISTRY = "crawler-registry";
    private static final String DEFAULT_REGION = "us-east-1";


    private static final Logger LOG = LoggerFactory.getLogger(KafkaStreamingJob.class);


    /**
     * Get configuration properties from Amazon Managed Service for Apache Flink runtime properties
     * GroupID "FlinkApplicationProperties", or from command line parameters when running locally
     */
    private static ParameterTool loadApplicationParameters(String[] args, StreamExecutionEnvironment env) throws IOException {
        if (env instanceof LocalStreamEnvironment) {
            return ParameterTool.fromArgs(args);
        } else {
            Map<String, Properties> applicationProperties = KinesisAnalyticsRuntime.getApplicationProperties();
            Properties flinkProperties = applicationProperties.get("FlinkApplicationProperties");
            if (flinkProperties == null) {
                throw new RuntimeException("Unable to load FlinkApplicationProperties properties from runtime properties");
            }
            Map<String, String> map = new HashMap<>(flinkProperties.size());
            flinkProperties.forEach((k, v) -> map.put((String) k, (String) v));
            return ParameterTool.fromMap(map);
        }
    }

    private static <T extends SpecificRecord> KafkaSource<T> kafkaSource(
            Class<T> payloadAvroClass,
            String bootstrapServers,
            String topic,
            String consumerGroupId,
            String schemaRegistryName,
            String schemaRegistryRegion,
            Properties kafkaConsumerConfig) {

        // DeserializationSchema for the message body: AVRO specific record, with Glue Schema Registry
        Map<String, Object> deserializerConfig = Map.of(
                AWSSchemaRegistryConstants.AVRO_RECORD_TYPE, AvroRecordType.SPECIFIC_RECORD.getName(),
                AWSSchemaRegistryConstants.AWS_REGION, schemaRegistryRegion,
                AWSSchemaRegistryConstants.REGISTRY_NAME, schemaRegistryName);
        DeserializationSchema<T> legacyDeserializationSchema = GlueSchemaRegistryAvroDeserializationSchema.forSpecific(payloadAvroClass, deserializerConfig);
        KafkaRecordDeserializationSchema<T> kafkaRecordDeserializationSchema = KafkaRecordDeserializationSchema.valueOnly(legacyDeserializationSchema);

        return KafkaSource.<T>builder()
                .setBootstrapServers(bootstrapServers)
                .setTopics(topic)
                .setGroupId(consumerGroupId)
                .setStartingOffsets(OffsetsInitializer.latest())
                .setDeserializer(kafkaRecordDeserializationSchema)
                .setProperties(kafkaConsumerConfig)
                .build();
    }

    private static <T extends SpecificRecord> KafkaSink<T> keyedKafkaSink(
            Class<T> payloadAvroClass,
            KeySelector<T, String> messageKeyExtractor,
            String bootstrapServers,
            String topic,
            String schemaRegistryName,
            String schemaRegistryRegion,
            Properties kafkaProducerConfig) {

        // SerializationSchema for the message body: AVRO with Glue Schema Registry
        // (GlueSchemaRegistryAvroSerializationSchema expects a Map<String,Object> as configuration)
        Map<String, Object> serializerConfig = Map.of(
                AWSSchemaRegistryConstants.SCHEMA_AUTO_REGISTRATION_SETTING, true, // Enable Schema Auto-registration (the name of the schema is based on the name of the topic)
                AWSSchemaRegistryConstants.AWS_REGION, schemaRegistryRegion,
                AWSSchemaRegistryConstants.REGISTRY_NAME, schemaRegistryName);
        SerializationSchema<T> valueSerializationSchema = GlueSchemaRegistryAvroSerializationSchema.forSpecific(payloadAvroClass, topic, serializerConfig);

        // SerializationSchema for the message key.
        // Extracts the key (a String) from the record using a KeySelector
        // and covert the String to bytes as UTF-8 (same default behaviour of org.apache.flink.api.common.serialization.SimpleStringSchema)
        SerializationSchema<T> keySerializationSchema = record -> {
            try {
                return messageKeyExtractor.getKey(record).getBytes(StandardCharsets.UTF_8);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        };

        // ... more Kafka consumer configurations (e.g. MSK IAM auth) go here...

        return KafkaSink.<T>builder()
                .setBootstrapServers(bootstrapServers)
                .setRecordSerializer(
                        KafkaRecordSerializationSchema.builder()
                                .setTopic(topic)
                                .setValueSerializationSchema(valueSerializationSchema)
                                .setKeySerializationSchema(keySerializationSchema)
                                .build())
                .setKafkaProducerConfig(kafkaProducerConfig)
                .build();
    }





    public static void main(String[] args) throws Exception {


        Map<String, Properties> applicationProperties = KinesisAnalyticsRuntime.getApplicationProperties();
        Properties flinkProperties = applicationProperties.get("FlinkApplicationProperties");
//        Properties flinkProperties = new Properties();

        Map<String, String> map = new HashMap<>(flinkProperties.size());
        flinkProperties.forEach((k, v) -> map.put((String) k, (String) v));

        ParameterTool parameterTool = ParameterTool.fromMap(map);

        // Set up properties directly without loading a YAML file
        Properties props = new Properties();
        props.put("openlineage.transport.type", parameterTool.get("lineageTransport","datazone"));
        props.put("openlineage.transport.domainId", parameterTool.get("datazoneDomainID"));
        String sourceClusterName = parameterTool.get("sourceClusterName");
        props.put("openlineage.dataset.namespaceResolvers." + sourceClusterName + ".type", "hostList");

        // Fetch the bootstrap servers from a parameter (e.g., "--bootstrap.servers" key)
        String bootstrapServers = parameterTool.get("bootstrap.servers");

        // Split the servers into an array
        String[] serverArray = bootstrapServers.split(",");

        // Format the output to display as an array without quotes
        StringBuilder result = new StringBuilder("[");
        for (int i = 0; i < serverArray.length; i++) {
            result.append(serverArray[i].trim()); // Trim whitespace around each server
            if (i < serverArray.length - 1) {
                result.append(", ");
            }
        }
        result.append("]");

        props.put("openlineage.dataset.namespaceResolvers." + sourceClusterName + ".hosts", result.toString());

        Configuration conf = ConfigurationUtils.createConfiguration(props);
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment(conf);
//        final StreamExecutionEnvironment env = StreamExecutionEnvironment.createLocalEnvironmentWithWebUI(conf);
//        final ParameterTool applicationProperties = loadApplicationParameters(args, env);
//        LOG.warn("Application properties: {}", applicationProperties.toMap());

        Properties properties = new Properties();

        properties.setProperty("security.protocol", "SASL_SSL");
        properties.setProperty("sasl.mechanism", "AWS_MSK_IAM");
        properties.setProperty("sasl.jaas.config", "software.amazon.msk.auth.iam.IAMLoginModule required;");
        properties.setProperty("sasl.client.callback.handler.class", "software.amazon.msk.auth.iam.IAMClientCallbackHandler");


        KafkaSource<User> source = kafkaSource(
                User.class,
                bootstrapServers,
                parameterTool.get("source.topic"),
                "flink-datazone-consumer",
                parameterTool.get("sourceRegistry"),
                parameterTool.get("region"),
                properties); // ...any other Kafka consumer property

        DataStream<User> userDataStream = env.fromSource(
                        source,
                        WatermarkStrategy.noWatermarks(),
                        "User Samples source")
                .uid("User-samples-source");

        userDataStream
                .map(new MapFunction<User, Tuple2<String,Integer>>() {
                    @Override
                    public Tuple2<String, Integer> map(User user) throws Exception {
                       return Tuple2.of(user.getName(),user.getFavoriteNumber());
                    }
                })
                .keyBy(x -> x.f0)
                        .sum(1).print();

        JobListener listener = OpenLineageFlinkJobListener.builder()
                .executionEnvironment(env)
                .jobTrackingInterval(Duration.ofMillis(30000))
                .jobName("Flink Consumer")
                .jobNamespace("Datazone Flink Jobs")
                .build();
        env.registerJobListener(listener);

        env.execute("Kafka Flink Job");
    }
}
