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
    // TODO: (SFAPP-274) We stitch schema here just to pass it for search schema creation (needed to delegateToSchema method execution)
    // TODO: but schema stitching should be executed only once. Should be fixed after "getProductsByIds" delegated call implementation
    let stitchedSchemas = stitchSchemas({
        mergeTypes: true,
        subschemas,
        // @ts-ignore
        resolvers,
        typeDefs,
    });

    if (config.get('ENABLE_SEARCH_STOREFRONT').asBoolean()) {
        console.log('search enabled');
        logger.debug('Search schema enabled');
        const search = await searchSchema({ config, logger, stitchedSchemas });
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
