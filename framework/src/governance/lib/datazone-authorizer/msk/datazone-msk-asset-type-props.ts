import { RemovalPolicy } from "aws-cdk-lib";
import { DataZoneCustomAssetType } from "../datazone-custom-asset-type";

export interface DataZoneMSKAssetTypeProps {
    readonly domainId: string
    readonly projectId: string
    readonly dzCustomAssetTypeHandler?: DataZoneCustomAssetType
    readonly removalPolicy?: RemovalPolicy
}