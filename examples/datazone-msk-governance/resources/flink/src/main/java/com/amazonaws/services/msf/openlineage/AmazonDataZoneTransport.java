package com.amazonaws.services.msf.openlineage;

import io.openlineage.client.OpenLineage;
import io.openlineage.client.OpenLineageClientException;
import io.openlineage.client.OpenLineageClientUtils;
import io.openlineage.client.transports.Transport;
import io.openlineage.client.transports.TransportConfig;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.http.apache.ApacheHttpClient;
import software.amazon.awssdk.services.datazone.DataZoneClient;
import software.amazon.awssdk.services.datazone.model.PostLineageEventRequest;

@Slf4j
public class AmazonDataZoneTransport extends Transport {
    private final DataZoneClient dataZoneClient;
    private final String domainId;

    public AmazonDataZoneTransport(@NonNull final AmazonDataZoneConfig dataZoneConfig) {
        this(
                DataZoneClient.builder()
                        .httpClientBuilder(ApacheHttpClient.builder())
                        .credentialsProvider(DefaultCredentialsProvider.create())
                        .build(),
                dataZoneConfig);
    }
    public AmazonDataZoneTransport(
            @NonNull final DataZoneClient dataZoneClient,
            @NonNull final AmazonDataZoneConfig dataZoneConfig) {
        super();
        validateDataZoneConfig(dataZoneConfig);
        this.dataZoneClient = dataZoneClient;
        this.domainId = dataZoneConfig.getDomainId();
    }
    @Override
    public void emit(@NonNull OpenLineage.RunEvent runEvent) {
        System.out.println(OpenLineageClientUtils.toJson(runEvent));
        log.info(OpenLineageClientUtils.toJson(runEvent));
        emit(OpenLineageClientUtils.toJson(runEvent));
    }
    @Override
    public void emit(@NonNull OpenLineage.DatasetEvent datasetEvent) {
        // Not supported in DataZone
        log.debug("DataSetEvent is not supported in DataZone {}", OpenLineageClientUtils.toJson(datasetEvent));
    }
    @Override
    public void emit(@NonNull OpenLineage.JobEvent jobEvent) {
        // Not supported in DataZone
        log.debug("DataSetEvent is not supported in DataZone {}", OpenLineageClientUtils.toJson(jobEvent));
    }
    public void emit(String eventAsJson) {
        try {
            this.dataZoneClient.postLineageEvent(
                    PostLineageEventRequest.builder()
                            .domainIdentifier(this.domainId)
                            .event(SdkBytes.fromUtf8String(eventAsJson))
                            .build());
        } catch (Exception e) {
            throw new OpenLineageClientException(
                    String.format("Failed to send lineage event to DataZone: %s", eventAsJson), e);
        }
    }
    private void validateDataZoneConfig(@NonNull final AmazonDataZoneConfig dataZoneConfig) {
        if (dataZoneConfig.getDomainId() == null) {
            throw new OpenLineageClientException(
                    "DomainId can't be null, try setting transport.domainId in config");
        }
    }
}
