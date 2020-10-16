import { stitchSchemas, SubschemaConfig } from 'graphql-tools';
import { GraphQLSchema, DocumentNode } from 'graphql';
import { createPremiumSearchSchema } from './premium-search';
import { createMonolithProxySchema } from './monolith-proxy';
import { createCatalogSchema } from './catalog';
import { getFrameworkConfig } from '../config';
import { Resolvers } from '../../../generated/graphql';

export async function buildFrameworkSchema() {
    const subschemas: (SubschemaConfig | GraphQLSchema)[] = [
        await createMonolithProxySchema(),
    ];
    const resolvers: Resolvers[] = [];
    const typeDefs: DocumentNode[] = [];
    const config = getFrameworkConfig();

    if (config.get('ENABLE_CATALOG_STOREFRONT').asBoolean()) {
        const catalog = await createCatalogSchema();
        resolvers.push(catalog.resolvers);
        typeDefs.push(catalog.typeDefs);
    }

    if (config.get('ENABLE_PREMIUM_SEARCH').asBoolean()) {
        const search = await createPremiumSearchSchema();
        subschemas.push(search.schema);
        resolvers.push(search.resolvers);
        typeDefs.push(search.typeDefs);
    }

    return stitchSchemas({
        mergeTypes: true,
        subschemas,
        // @ts-ignore
        resolvers,
        typeDefs,
    });
}
