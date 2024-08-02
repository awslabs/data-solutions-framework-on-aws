import { DataZoneFormTypeModelFieldProps } from './datazone-model-field-props';

/**
 * Build a Smithy model string from model fields.
 * @param name The name of the model structure.
 * @param fields The list of fields in the model.
 * @returns The Smithy model string.
 */
export function buildModelString(name: string, fields: DataZoneFormTypeModelFieldProps[]): string {
  const fieldStrings = fields.map(field => {
    const requiredIndicator = field.required ? '@required' : '';
    return `${requiredIndicator}\n${field.name}: ${field.type}`;
  });

  return `
    structure ${name} {
      ${fieldStrings.join('\n')}
    }
  `;
}