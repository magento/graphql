import { GraphQLField } from 'graphql';
import { SchemaDirectiveVisitor } from 'graphql-tools';
import { invokeRemoteResolver } from './adobe-io';
import { DocumentNode, visit } from 'graphql';
import { assert } from '../../assert';
import openwhisk from 'openwhisk';

/**
 * @summary We allow extension developers to specify an I/O function
 *          name for @function, but we don't want them to have to
 *          specify the name of the package they're already in.
 *          So we pre-process the @function directive's name arg
 *          and prepend the package name as a convenience
 */
export function prependPkgNameToFunctionDirectives(
    schema: DocumentNode,
    pkg: string,
): DocumentNode {
    return visit(schema, {
        Directive(node) {
            if (node.name.value !== 'function') return;

            const { arguments: args } = node;
            if (!Array.isArray(args) || args.length !== 1) {
                throw new Error('Expected 1 argument to @function');
            }

            const funcName = args[0].value.value as string;
            args[0].value.value = `${pkg}/${funcName}`;
        },
    });
}

export function createFunctionDirectiveVisitor(owOpts: openwhisk.Options) {
    return class FunctionDirectiveVisitor extends SchemaDirectiveVisitor {
        visitFieldDefinition(field: GraphQLField<unknown, unknown>) {
            const resolver = (parent: unknown, args: unknown) => {
                const resolverData = {
                    parent,
                    args,
                };
                const directiveArgs = (this as any).args;
                assert(
                    typeof directiveArgs.name === 'string',
                    'Expected @function directive name',
                );
                return invokeRemoteResolver(
                    {
                        action: directiveArgs.name,
                        resolverData,
                    },
                    owOpts,
                );
            };
            field.resolve = resolver;
        }
    };
}
