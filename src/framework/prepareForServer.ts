import { mergeSchemas } from 'graphql-tools';
import { join } from 'path';
import { contextBuilder } from './contextBuilder';
import { collectLocalExtensions } from './localExtensions';

/**
 * @summary Creates a new executable GraphQL schema and context
 *          function that can be used with any node HTTP library
 */
export async function prepareForServer() {
    const builtInExtensionsRoot = join(__dirname, '../extensions');
    // TODO: Support more than just our built-in modules
    const extensionRoots = [builtInExtensionsRoot];
    const localExtensions = await collectLocalExtensions(extensionRoots);

    const schema = mergeSchemas({
        schemas: localExtensions.schemas,
        typeDefs: localExtensions.typeDefs,
        // @ts-ignore The `IResolvers` type that graphql-tools
        // uses has a string:any index signature that would widen
        // types, so we're ignoring it
        resolvers: localExtensions.resolvers,
        mergeDirectives: true,
    });

    const context = contextBuilder({
        extensions: localExtensions.extensions,
    });

    return { schema, context };
}
