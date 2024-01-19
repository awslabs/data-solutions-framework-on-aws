// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { RuleTester, type Rule } from 'eslint';
import * as ts from 'typescript';
import request from 'sync-request-curl';
import * as ESTree from 'estree';

export default {
    // Put the following comment above a code line you want to exclude from this check, e.g. after review:
    // eslint-disable-next-line local-rules/no-tokens-in-construct-id
    'no-tokens-in-construct-id': {
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
    'url-checker': {
        meta: {
            docs: {
                description: 'Checks the URLs in the comment-docs for accessibility'
            },
            schema: [],
        },        
        create: function (context: Rule.RuleContext) : Rule.RuleListener {
            function checkProgramComment(program: ESTree.Program): void {
                if (!program.comments) {
                    return;
                }

                for (const c of program.comments.filter(c => c.type == 'Block')) {
                    const matches = c.value.match(/\bhttps?:\/\/[\-A-Za-z0-9+&@#\/%?=~_|!:,.;]*[\-A-Za-z0-9+&@#\/%=~_|]/);
                    if (!matches || matches.length == 0) {
                        continue;
                    }

                    for (const url of matches) {
                        try {
                            const res = request('GET', url, { headers: { 'user-agent': 'libcurl/1.0.6'} });
                            if (res.statusCode != 200) {
                                context.report({
                                    loc: c.loc!,                                    
                                    message: `Fetching the URL '${url}' resulted in HTTP ${res.statusCode}`,
                                });
                            }
                        }
                        catch (e) {
                            context.report({
                                loc: c.loc!,
                                message: `Failed to check the URL '${url}': ${e}`,
                            });
                        }
                    }
                }
            }

            return {
                Program: checkProgramComment,
            };
        },
    },
} satisfies Record<string, Rule.RuleModule>;


