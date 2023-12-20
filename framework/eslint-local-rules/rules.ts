// Put the following comment above a code line you want to exclude from this check, e.g. after review:
// eslint-disable-next-line local-rules/no-tokens-in-construct-id

import type { Rule } from "eslint";
import * as ts from "typescript";

export default {
    "no-tokens-in-construct-id": {
        meta: {
            docs: {
                description: 'Checks whether a CDK token might appear in a construct ID on instantiation',
                recommended: true                
            },
            schema: [],
        },
        create: function (context) {
            return {
                NewExpression: function (node) { 
                    if (node.callee.type != 'Identifier') {
                        return;
                    }

                    const typeChecker = context.parserServices.program.getTypeChecker();
                    const typescriptNode = <ts.Node>context.parserServices.esTreeNodeToTSNodeMap.get(node);
                    const instantiatedType = <ts.Type>typeChecker.getTypeAtLocation(typescriptNode);
                    const baseTypes = instantiatedType.getBaseTypes();

                    if (instantiatedType.symbol.name == 'Construct' || baseTypes && baseTypes.some(t => t.symbol.name == 'Construct')) {
                        if (node.arguments.length <= 1) {
                            // Non-standard schema, expected at least 2 parameters
                            return;
                        }
                      
                        // We expect the second argument to be the ID
                        const secondArgument = node.arguments[1];
                           
                        if (secondArgument.type == 'Literal') {
                            if (secondArgument.value?.toString().startsWith('${TOKEN')) {
                                context.report({
                                    node,
                                    message: 'The ID argument of a construct contains a token, this is not allowed.'
                                });
                            }

                            // No further check needed for literals
                            return;
                        }

                        context.report({
                            node,
                            message: 'An expression is used for the construct ID. it might contain tokens, please review. ' +
                                'Suppress this finding by putting this comment above the code line: // eslint-disable-next-line local-rules/no-tokens-in-construct-id'
                        });
                    }
                },
            };
        },
    },
} satisfies Record<string, Rule.RuleModule>;