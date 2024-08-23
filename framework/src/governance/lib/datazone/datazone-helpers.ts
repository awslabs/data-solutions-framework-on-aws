import { CfnSubscriptionTarget } from 'aws-cdk-lib/aws-datazone';
import { IRole } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { CustomAssetType } from './datazone-custom-asset-type-factory';
import { DataZoneFormType } from './datazone-custom-asset-type-props';


const validSmithyTypes = [
  'string', 'boolean', 'byte', 'short', 'integer', 'long', 'float', 'double',
  'bigInteger', 'bigDecimal', 'blob', 'document', 'timestamp', 'enum', 'intEnum',
];

function isValidSmithyType(type: string): boolean {
  return validSmithyTypes.includes(type.toLowerCase());
}


/**
 * Build a Smithy model string from model fields.
 * @param name The name of the model structure.
 * @param fields The list of fields in the model.
 * @returns The Smithy model string.
 */
export function buildModelString(formType: DataZoneFormType): string|undefined {

  if (formType.model !== undefined) {
    const fieldStrings = formType.model.map(field => {
      const requiredIndicator = field.required ? '@required' : '';
      // Check if field.type is a valid Smithy type
      if (isValidSmithyType(field.type)) {
        const uppercasedType = field.type.charAt(0).toUpperCase() + field.type.toLowerCase().slice(1);
        return `${requiredIndicator}\n${field.name}: ${uppercasedType}`;
      } else {
        throw new Error(`Invalid field type: ${field.type}`);
      }
    });

    return `
      structure ${formType.name} {
        ${fieldStrings.join('\n')}
      }
    `;
  } else {
    return undefined;
  }
}

export function createSubscriptionTarget(
  scope: Construct,
  id: string,
  customAssetType: CustomAssetType,
  name: string,
  provider: string,
  environmentId: string,
  authorizedPrincipals: IRole[],
  manageAccessRole: IRole) {

  // TODO collect env role and pass it
  return new CfnSubscriptionTarget(
    scope,
    `${id}SubscriptionTarget`,
    {
      applicableAssetTypes: [customAssetType.name],
      authorizedPrincipals: authorizedPrincipals.map((r) => r.roleArn),
      domainIdentifier: customAssetType.domainIdentifier,
      environmentIdentifier: environmentId,
      manageAccessRole: manageAccessRole.roleArn,
      name,
      provider,
      subscriptionTargetConfig: [],
      type: 'BaseSubscriptionTargetType',
    },
  );
}