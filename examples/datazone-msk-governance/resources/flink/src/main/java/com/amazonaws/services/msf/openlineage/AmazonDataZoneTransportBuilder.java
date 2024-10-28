package com.amazonaws.services.msf.openlineage;

import io.openlineage.client.transports.Transport;
import io.openlineage.client.transports.TransportBuilder;
import io.openlineage.client.transports.TransportConfig;

public class AmazonDataZoneTransportBuilder implements TransportBuilder {

    @Override
    public TransportConfig getConfig() {
        // Return a default or custom config (even an empty one in this case)
        return (TransportConfig) new AmazonDataZoneConfig();
    }

    @Override
    public Transport build(TransportConfig config) {
        // Build the transport instance
        return new AmazonDataZoneTransport((AmazonDataZoneConfig) config);
    }

    @Override
    public String getType() {
        // This is the name you'll use in your configuration
        return "datazone";  // The transport type you will specify in your config
    }
}