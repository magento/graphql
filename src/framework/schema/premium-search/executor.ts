import { AsyncExecutor, ExecutionParams } from 'graphql-tools';
import { print } from 'graphql';
import fetch from 'node-fetch';
import { GraphQLContext } from '../../types';

/**
 * @summary Builds a graphql-tools "executor" that can be used to build
 *          a delegating copy of the remote service's schema
 * @param  searchURL Absolute URL of the Search Service's GraphQL endpoint
 * @param  apiKey Value passed to Search Service as "X-API-KEY" header
 */
export const createSearchExecutor = (
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
