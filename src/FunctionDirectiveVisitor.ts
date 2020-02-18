import { GraphQLField } from 'graphql';
import { SchemaDirectiveVisitor } from 'apollo-server';
import { invokeFunction } from './adobe-io';
import { DocumentNode, visit } from 'graphql';

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

/**
 * @summary Applies resolvers specified by @function directive.
 */
export class FunctionDirectiveVisitor extends SchemaDirectiveVisitor {
    // Apollo has this typed as "any" in the SchemaDirectiveVisitor.
    // TS won't let us change the type unless we re-assign
    args: { name: string } = this.args;

    visitFieldDefinition(field: GraphQLField<unknown, unknown>) {
        // TODO: Break out resolver to a separate function/file
        // for ease of testing its guts
        const resolver = (parent: unknown, args: unknown) => {
            const resolverData = {
                parent,
                args,
            };
            return invokeFunction({
                action: this.args.name,
                params: {
                    resolverData: JSON.stringify(resolverData),
                },
            });
        };
        field.resolve = resolver;
    }
}
