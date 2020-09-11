import { createExtension } from '../../api';
import {
    introspectSchema,
    wrapSchema,
    AsyncExecutor,
    RenameTypes,
    FilterObjectFields,
    ExecutionParams,
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
    const executor = createSearchExecutor(searchURL, apiKey);
    let searchSchema;

    try {
        searchSchema = await introspectSchema(executor);
    } catch (err) {
        throw new Error('Failed introspecting remote Search Schema');
    }

    const transformedSchema = wrapSchema({ schema: searchSchema, executor }, [
        new RenameTypes(name => {
            // Prevent conflict with Magento Core's "Price" type
            if (name === 'Price') return 'SearchServicePrice';
        }),
        new FilterObjectFields((typeName, fieldName) => {
            return !(typeName === 'ProductItem' && fieldName === 'Price');
        }),
    ]);

    api.addSchema(transformedSchema);
});

const createSearchExecutor = (
    searchURL: string,
    apiKey: string,
): AsyncExecutor => {
    return (opts: ExecutionParams) => {
        const headers = {
            'Content-Type': 'application/json',
            'X-API-KEY': apiKey,
        };

        if (opts.context) {
            const ctx: GraphQLContext = opts.context;
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
                query: print(opts.document),
                variables: opts.variables,
            }),
        }).then(res => res.json());
    };
};
