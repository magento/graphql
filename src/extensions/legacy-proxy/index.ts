import { createMonolithApolloFetcher } from './apollo-fetcher';
import { introspectSchema, makeRemoteExecutableSchema } from 'graphql-tools';
import { createExtension } from '../../api';

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
    const fetcher = createMonolithApolloFetcher(legacyURL);
    let legacySchema;
    try {
        legacySchema = await introspectSchema(fetcher);
    } catch (err) {
        throw new Error(
            `Failed introspecting remote Magento schema at "${legacyURL}". ` +
                'Make sure that the LEGACY_GRAPHQL_URL variable is set to ' +
                'the correct value for your Magento instance',
        );
    }

    api.addSchema(
        makeRemoteExecutableSchema({
            schema: legacySchema,
            fetcher,
        }),
    );
});
