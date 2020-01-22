import { DataSource, DataSourceConfig } from 'apollo-datasource';
import { KeyValueCache, InMemoryLRUCache } from 'apollo-server-caching';
import { Client } from 'grpc';

/**
 * @summary Apollo Server DataSource base class for gRPC.
 * @todo Add caching support when Magento microservices have a way
 *       to advertise their caching policies.
 * @see https://grpc.io/docs/guides/
 * @see https://www.apollographql.com/docs/apollo-server/data/data-sources/
 */
export abstract class GRPCDataSource<
    TClient extends Client,
    TContext = unknown
> extends DataSource {
    context!: TContext;
    client: TClient;
    cache!: KeyValueCache;

    constructor(client: TClient) {
        super();
        this.client = client;
    }

    initialize(config: DataSourceConfig<TContext>) {
        this.context = config.context;
        // Use cache impl specified by server, if provided
        this.cache = config.cache || new InMemoryLRUCache();
    }
}
