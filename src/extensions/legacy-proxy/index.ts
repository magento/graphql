import { createMonolithExecutor } from './monolith-executor';
import { introspectSchema, makeRemoteExecutableSchema } from 'graphql-tools';
import { createExtension } from '../../api';
import { typeDefs } from './typeDefs';
// import { buildASTSchema, findBreakingChanges } from 'graphql';

const extensionConfig = {
    LEGACY_GRAPHQL_URL: {
        docs: 'Absolute URL of Magento Core GraphQL endpoint',
    },
};

/**
 * @summary Magento GraphQL Extension to proxy
 *          some requests back to the Magento PHP
 *          implementation of GraphQL. This is done
 *          to allow a gradual migration off the
 *          legacy GraphQL API.
 *
 *          As new storefront services are written,
 *          their implementations in PHP GraphQL will
 *          be deprecated, and this project will become
 *          the sole owner of the GraphQL schema for Magento
 *          eCommerce APIs.
 *
 *          Note that, at the time of writing, the recommended
 *          way to proxy a schema seems to be with Federation.
 *          Federation requires a 2-way contract: the proxied
 *          GraphQL API (our PHP app) needs to know how to be
 *          federated. Because this proxy is temporary and
 *          changes to Magento core are slow, we're using
 *          a remote schema + stitching for now.
 *
 *          We can and should revisit this decision if stitching
 *          becomes hard to maintain.
 */
export default createExtension(extensionConfig, async (config, api) => {
    const legacyURL = config.get('LEGACY_GRAPHQL_URL').asString();
    const executor = createMonolithExecutor(legacyURL);
    let legacySchema;
    try {
        legacySchema = await introspectSchema(executor);
    } catch (err) {
        throw new Error(
            `Failed introspecting remote Magento schema at "${legacyURL}". ` +
                'Make sure that the LEGACY_GRAPHQL_URL variable is set to ' +
                'the correct value for your Magento instance',
        );
    }

    for (const def of typeDefs.definitions) {
        // Extension types extend from the root Query type, but we're
        // using the typeDefs to create a stand-alone schema for the purpose
        // of breaking change detection. Mutations here are fine because
        // the schema is discarded after the breaking change detection
        if (def.kind === 'ObjectTypeExtension' && def.name.value === 'Query') {
            (def.kind as any) = 'ObjectTypeDefinition';
            break;
        }
    }
    // const knownSchema = buildASTSchema(typeDefs);
    // const breakingChanges = findBreakingChanges(knownSchema, legacySchema);

    // if (breakingChanges.length) {
    //     const changes = breakingChanges
    //         .map(c => `    ${c.description}`)
    //         .join('\n');
    //     throw new Error(
    //         "Incompatibilities were found in your store's schema\n" +
    //             `  Store: ${legacyURL}\n` +
    //             `  Reasons:\n    ${changes}`,
    //     );
    // }

    api.addSchema(
        makeRemoteExecutableSchema({
            schema: legacySchema,
            executor,
        }),
    );
});
