import { stitchSchemas } from 'graphql-tools';
import { createPremiumSearchSchema } from './premium-search';
import { createMonolithProxySchema } from './monolith-proxy';

export async function buildFrameworkSchema() {
    const monolithProxy = await createMonolithProxySchema();
    const searchSchema = await createPremiumSearchSchema();

    const gateway = stitchSchemas({
        subschemas: [monolithProxy, searchSchema.schema],
        mergeTypes: true,
        // @ts-ignore
        resolvers: [searchSchema.resolvers],
        typeDefs: [searchSchema.typeDefs],
    });

    return gateway;
}
