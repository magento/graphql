import { mergeSchemas } from 'graphql-tools';
import { join } from 'path';
import { contextBuilder } from './contextBuilder';
import { collectRemoteExtensions } from './collectRemoteExtensions';
import { collectLocalExtensions } from './localExtensions';

export type MagentoGraphQLOpts = {
    adobeIOPackages?: string[];
};

/**
 * @summary Creates a new executable GraphQL schema and context
 *          function that can be used with any node HTTP library
 */
export async function prepareForServer(opts: MagentoGraphQLOpts) {
    const builtInExtensionsRoot = join(__dirname, '../extensions');
    // TODO: Support more than just our built-in modules
    const extensionRoots = [builtInExtensionsRoot];
    const localExtensions = await collectLocalExtensions(extensionRoots);
    const schemas = [...localExtensions.schemas, ...localExtensions.typeDefs];
    if (Array.isArray(opts.adobeIOPackages)) {
        schemas.push(await collectRemoteExtensions(opts.adobeIOPackages));
    }

    const schema = mergeSchemas({
        // @ts-ignore Types are wrong. The lib's implementation
        // already merges this array with `typeDefs`
        // https://github.com/Urigo/graphql-tools/blob/03b70c3f3dc71bdb846aa02bdd645ab4b3a96a87/src/stitch/mergeSchemas.ts#L106-L108
        subschemas: schemas,
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
