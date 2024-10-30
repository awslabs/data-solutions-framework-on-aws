package com.amazonaws.services.msf.openlineage;


import io.openlineage.client.MergeConfig;
import io.openlineage.client.transports.TransportConfig;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public final class AmazonDataZoneConfig implements TransportConfig, MergeConfig<AmazonDataZoneConfig> {
    private String domainId;

    @Override
    public AmazonDataZoneConfig mergeWithNonNull(AmazonDataZoneConfig other) {
        return new AmazonDataZoneConfig(mergePropertyWith(domainId, other.domainId));
    }
}