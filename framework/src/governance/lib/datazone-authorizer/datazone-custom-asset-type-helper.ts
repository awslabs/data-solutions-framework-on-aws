import { Construct } from "constructs";
import { CustomAssetType } from "./datazone-custom-asset-type-factory";
import { IRole } from "aws-cdk-lib/aws-iam";
import { CfnSubscriptionTarget } from "aws-cdk-lib/aws-datazone";

export function createSubscriptionTarget(scope: Construct, customAssetType: CustomAssetType
    , name: string, provider: string, environmentId: string
    , authorizedPrincipals: IRole[], manageAccessRole: IRole) {

    return new CfnSubscriptionTarget(
        scope,
        `SubscriptionTarget-${customAssetType.name}-${environmentId}`,
        {
            applicableAssetTypes: [customAssetType.name],
            authorizedPrincipals: authorizedPrincipals.map((r) => r.roleArn),
            domainIdentifier: customAssetType.domainIdentifier,
            environmentIdentifier: environmentId,
            manageAccessRole: manageAccessRole.roleArn,
            name,
            provider,
            subscriptionTargetConfig: [],
            type: "BaseSubscriptionTargetType"
        }
    )
}