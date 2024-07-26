import { Construct } from "constructs";
import { Context, TrackedConstruct, TrackedConstructProps } from "../../../utils";
import { CreateDataZoneCustomAssetTypeProps, DataZoneCustomAssetTypeProps } from "./datazone-custom-asset-type-props";
import { Effect, IRole, ManagedPolicy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { DsfProvider } from "../../../utils/lib/dsf-provider";
import { CustomResource, Duration, RemovalPolicy } from "aws-cdk-lib";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { ILogGroup } from "aws-cdk-lib/aws-logs";

export interface CustomAssetType {
    domainIdentifier: string
    name: string
    projectIdentifier: string
    revision: string
}

export class DataZoneCustomAssetTypeFactory extends TrackedConstruct {
    /**
     * The CloudWatch Logs Log Group for the Redshift Serverless creation
     */
    readonly createLogGroup: ILogGroup;
    /**
     * The Lambda Function for the Redshift Serverless creation
     */
    readonly createFunction: IFunction;
    /**
     * The IAM Role for the Redshift Serverless creation
     */
    readonly createRole: IRole;
    /**
     * The CloudWatch Logs Log Group for the creation status check
     */
    readonly statusLogGroup: ILogGroup;
    /**
     * The Lambda Function for the creation status check
     */
    readonly statusFunction: IFunction;
    /**
     * The IAM Role for the creation status check
     */
    readonly statusRole: IRole;

    readonly serviceToken: string

    private readonly removalPolicy: RemovalPolicy
    constructor(scope: Construct, id: string, props: DataZoneCustomAssetTypeProps) {
        const trackedConstructProps: TrackedConstructProps = {
            trackingTag: DataZoneCustomAssetTypeFactory.name,
        };

        super(scope, id, trackedConstructProps);
        this.removalPolicy = Context.revertRemovalPolicy(scope, props.removalPolicy);
        const handlerRole = new Role(this, "HandlerRole", {
            assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
            managedPolicies: [
                ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
            ],
            inlinePolicies: {
                "DataZonePermission": new PolicyDocument({
                    statements: [
                        new PolicyStatement({
                            effect: Effect.ALLOW,
                            actions: [
                                "datazone:CreateFormType",
                                "datazone:CreateAssetType",
                                "datazone:DeleteAssetType",
                                "datazone:DeleteFormType"
                            ],
                            resources: ["*"]
                        })
                    ]
                })
            }
        })

        handlerRole.applyRemovalPolicy(this.removalPolicy)

        const provider = new DsfProvider(this, 'Provider', {
            providerName: 'DataZoneCustomAssetType',
            onEventHandlerDefinition: {
              depsLockFilePath: __dirname+'/resources/cr-dz-custom-asset-type/package-lock.json',
              entryFile: __dirname+'/resources/cr-dz-custom-asset-type/index.mjs',
              handler: 'index.handler',
              iamRole: handlerRole,
              timeout: Duration.minutes(5),
            },
            queryInterval: Duration.seconds(1),
            queryTimeout: Duration.minutes(5),
            removalPolicy: this.removalPolicy,
        });

        this.createLogGroup = provider.onEventHandlerLogGroup;
        this.createFunction = provider.onEventHandlerFunction;
        this.createRole = provider.onEventHandlerRole;
        this.statusLogGroup = provider.isCompleteHandlerLog!;
        this.statusFunction = provider.isCompleteHandlerFunction!;
        this.statusRole = provider.isCompleteHandlerRole!;
        this.serviceToken = provider.serviceToken;
    }

    public createCustomAssetType(id: string, customAssetType: CreateDataZoneCustomAssetTypeProps): CustomAssetType {
        const crResp = new CustomResource(this, id, {
            serviceToken: this.serviceToken,
            removalPolicy: this.removalPolicy,
            properties: {
                domainId: customAssetType.domainId,
                projectId: customAssetType.projectId,
                formTypes: customAssetType.formTypes,
                assetTypeName: customAssetType.assetTypeName,
                assetTypeDescription: customAssetType.assetTypeDescription
            }
        })

        return {
            domainIdentifier: crResp.getAttString("domainId"),
            name: crResp.getAttString("name"),
            projectIdentifier: crResp.getAttString("owningProjectId"),
            revision: crResp.getAttString("revision")
        }
    }
}