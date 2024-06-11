import { RemovalPolicy } from "aws-cdk-lib"

export interface DataZoneFormType {
    readonly name: string
    readonly model: string
    readonly required: boolean
}

export interface DataZoneCustomAssetTypeProps {
    readonly removalPolicy?: RemovalPolicy
}

export interface CreateDataZoneCustomAssetTypeProps {
    readonly domainId: string
    readonly projectId: string
    readonly formTypes: DataZoneFormType[]
    readonly assetTypeName: string
    readonly assetTypeDescription?: string,
}