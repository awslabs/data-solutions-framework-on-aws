import logging
from typing import Dict, Any
from dataclasses import dataclass
from openlineage.client.transport import Transport, Config
from openlineage.client.serde import Serde
from openlineage.client import event_v2
from openlineage.client.run import RunEvent
import boto3
import yaml
import json
# Define the configuration class for DataZone
@dataclass
class DataZoneConfig(Config):
    domain_id: str
    region: str  # Add region to the configuration

    @classmethod
    def from_dict(cls, params: Dict[str, Any]) -> "DataZoneConfig":
        if "domain_id" not in params:
            raise RuntimeError("`domain_id` key not passed to DataZoneConfig")
        if "region" not in params:
            raise RuntimeError("`region` key not passed to DataZoneConfig")
        return cls(domain_id=params["domain_id"], region=params["region"])

# Define the transport class for DataZone
class DataZoneTransport(Transport):
    kind = "datazone"  # Define the kind of transport
    config_class = DataZoneConfig

    def __init__(self, config: DataZoneConfig) -> None:
        self.config = config
        self._setup_datazone()

    def emit(self, event) -> None:
        # Only process RunEvent types
        if not isinstance(event, (RunEvent, event_v2.RunEvent)):
            return

        test=Serde.to_json(event).encode("utf-8")
        self.datazone.post_lineage_event(domainIdentifier=self.config.domain_id, event=test)

    def _setup_datazone(self) -> None:
        try:
            # Set up the boto3 DataZone client with the specified region
            self.datazone = boto3.client("datazone", region_name=self.config.region)
        except ModuleNotFoundError:
            logging.error(
                "boto3 module not found. Installing it is required for DataZoneTransport to work."
            )
            raise
        except Exception as e:
            logging.error(f"Failed to set up DataZone client: {e}")
            raise