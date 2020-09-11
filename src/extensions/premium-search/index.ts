import { createExtension } from '../../api';
import {
    IFetcherOperation,
    introspectSchema,
    makeRemoteExecutableSchema,
} from 'graphql-tools';
import fetch from 'node-fetch';
import { print } from 'graphql';
import { GraphQLContext } from '../../types';

const extensionConfig = {
    PREMIUM_SEARCH_GRAPHQL_URL: {
        docs: 'Absolute URL of Premium Search GraphQL endpoint',
    },
    PREMIUM_SEARCH_API_KEY: {
        docs: 'Key passed to Premium Search using "X-API-KEY" header',
    },
};

export default createExtension(extensionConfig, async (config, api) => {
    const searchURL = config.get('PREMIUM_SEARCH_GRAPHQL_URL').asString();
    const apiKey = config.get('PREMIUM_SEARCH_API_KEY').asString();
    const fetcher = createSearchFetcher(searchURL, apiKey);

    let searchSchema;

    try {
        searchSchema = await introspectSchema(fetcher);
    } catch (err) {
        throw new Error('Failed introspecting remote Search Schema');
    }

    api.addSchema(
        makeRemoteExecutableSchema({
            schema: searchSchema,
            fetcher,
        }),
    );
});

const createSearchFetcher = (searchURL: string, apiKey: string) => {
    return (opts: IFetcherOperation) => {
        const headers = {
            'Content-Type': 'application/json',
            'X-API-KEY': apiKey,
        };

        if (opts.context && opts.context.graphqlContext) {
            const ctx = opts.context.graphqlContext as GraphQLContext;
            Object.assign(headers, {
                'MAGENTO-ENVIRONMENT-ID':
                    ctx.requestHeaders['magento-environment-id'],
                'MAGENTO-STORE-CODE': ctx.requestHeaders['magento-store-code'],
                'MAGENTO-STORE-VIEW-CODE':
                    ctx.requestHeaders['magento-store-view-code'],
                'MAGENTO-WEBSITE-CODE':
                    ctx.requestHeaders['magento-website-code'],
            });
        }
        return fetch(searchURL, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                query: print(opts.query),
                variables: opts.variables,
                operationName: opts.operationName,
            }),
        }).then(res => res.json());
    };
};
