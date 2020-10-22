/**
 * @summary All configuration values that can be supplied to the application
 */
export const frameworkConfig = {
    LOG_FILE: {
        docs: 'Absolute path to write log files to',
        default: '/usr/app/app.log',
    },
    LOG_LEVEL: {
        docs:
            'Logger level. Can be one of: fatal/error/warn/info/debug/trace/silent',
        default: 'info',
    },
    HOST: {
        docs: 'Host for the GraphQL server to listen on',
        default: '0.0.0.0',
    },
    PORT: {
        docs: 'Port for GraphQL server to listen on',
        default: '8008',
    },
    MONOLITH_GRAPHQL_URL: {
        docs:
            'Absolute URL of Magento Core GraphQL endpoint. Used to proxy requests for parts of the schema not yet implemented',
        default: 'https://store.test/graphql',
    },
    ENABLE_CATALOG_STOREFRONT: {
        docs: 'Enable the Catalog Storefront integration',
        default: 'false',
    },
    CATALOG_STOREFRONT_HOST: {
        docs: 'Host of the Catalog Storefront gRPC API',
        default: 'catalog-storefront.test',
    },
    CATALOG_STOREFRONT_PORT: {
        docs: 'Port of the Catalog Storefront gRPC API',
        default: '9001',
    },
    ENABLE_PREMIUM_SEARCH: {
        docs: 'Enables the Magento Premium Search integration',
        default: 'false',
    },
    PREMIUM_SEARCH_GRAPHQL_URL: {
        docs: 'Absolute URL of Premium Search GraphQL endpoint',
        default: 'https://premium-search.test/graphql',
    },
    PREMIUM_SEARCH_API_KEY: {
        docs: 'Key passed to Premium Search using "X-API-KEY" header',
        default: 'api-key',
    },
    UNSUPPORTED_APOLLO_SERVER: {
        docs:
            'Use apollo-server-fastify instead of fastify-gql. Mainly used to validate our early performance research',
        default: 'false',
    },
};
