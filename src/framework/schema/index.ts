import { stitchSchemas, SubschemaConfig } from 'graphql-tools';
import { GraphQLSchema, DocumentNode } from 'graphql';
import { createPremiumSearchSchema } from './premium-search';
import { createMonolithProxySchema } from './monolith-proxy';
import { catalogSchema } from './catalog';
import { searchSchema } from './catalog-search';
import { FrameworkConfig } from '../config';
import { Resolvers } from '../../../generated/graphql';
import { Logger } from '../logger';

type Opts = {
    config: FrameworkConfig;
    logger: Logger;
};

export async function buildFrameworkSchema({ config, logger }: Opts) {
    logger.info('Building framework schema');

    const subschemas: (SubschemaConfig | GraphQLSchema)[] = [
        await createMonolithProxySchema({ config, logger }),
    ];
    const resolvers: Resolvers[] = [];
    const typeDefs: DocumentNode[] = [];

    if (config.get('ENABLE_CATALOG_STOREFRONT').asBoolean()) {
        logger.debug('Catalog schema enabled');
        const readyCatalogSchema = await catalogSchema({ config, logger });
        subschemas.push(readyCatalogSchema);
    }

    if (config.get('ENABLE_PREMIUM_SEARCH').asBoolean()) {
        logger.debug('Premium Search schema enabled');
        subschemas.push(await createPremiumSearchSchema({ config, logger }));
    }

    if (config.get('ENABLE_SEARCH_STOREFRONT').asBoolean()) {
        logger.debug('Storefront Search enabled');
        const search = await searchSchema({ config, logger });
        subschemas.push(search);
    }

    return stitchSchemas({
        mergeTypes: true,
        subschemas,
        // @ts-ignore
        resolvers,
        typeDefs,
    });
}
