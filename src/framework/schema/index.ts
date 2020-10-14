import { stitchSchemas, SubschemaConfig, IResolvers } from 'graphql-tools';
import { GraphQLSchema, DocumentNode } from 'graphql';
import { createPremiumSearchSchema } from './premium-search';
import { createMonolithProxySchema } from './monolith-proxy';
import { getFrameworkConfig } from '../config';

export async function buildFrameworkSchema() {
    const monolithProxy = await createMonolithProxySchema();
    const stitchingConfig = {
        subschemas: [monolithProxy] as (SubschemaConfig | GraphQLSchema)[],
        resolvers: [] as IResolvers[],
        typeDefs: [] as (DocumentNode | string)[],
        mergeTypes: true,
    };
    const config = getFrameworkConfig();

    if (config.get('ENABLE_PREMIUM_SEARCH').asBoolean()) {
        const search = await createPremiumSearchSchema();
        stitchingConfig.subschemas.push(search.schema);
        // @ts-ignore
        stitchingConfig.resolvers.push(search.resolvers);
        stitchingConfig.typeDefs.push(search.typeDefs);
    }

    return stitchSchemas(stitchingConfig);
}
