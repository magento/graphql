import { AsyncExecutor, ExecutionParams } from 'graphql-tools';
import { print } from 'graphql';
import { GraphQLContext } from '../../types';
import { default as nodeFetch } from 'node-fetch';

/**
 * @summary Create a custom "executor" for wrapSchema to use
 *          when calling the monolith Magento GraphQL API (PHP).
 *          Ensures required Magento headers are passed along
 *
 * @see https://devdocs.magento.com/guides/v2.3/graphql/send-request.html#request-headers
 * @see https://www.graphql-tools.com/docs/remote-schemas#wrapschemaschemaconfig
 */
export function createMonolithExecutor(
    monolithGraphQLUrl: string,
    fetch: WindowOrWorkerGlobalScope['fetch'] | typeof nodeFetch = nodeFetch,
): AsyncExecutor {
    return async (opts: ExecutionParams) => {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (opts.context) {
            const context: GraphQLContext = opts.context;
            Object.assign(
                headers,
                filterUndefinedEntries({
                    Authorization: `Bearer ${context.monolithToken}`,
                    'Content-Currency': context.currency,
                    Store: context.store,
                }),
            );
        }

        // TODO: Re-write queries (not mutations) to GET where possible,
        //       to hit varnish for some warm cache wins
        const result = await fetch(monolithGraphQLUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                query: print(opts.document),
                variables: opts.variables,
            }),
        });

        return result.json();
    };
}

/**
 * @summary Create a new object based on an existing one,
 *          excluding entries with an undefined value
 */
const filterUndefinedEntries = <K extends string, V>(obj: Record<K, V>) => {
    return Object.fromEntries(
        Object.entries(obj).filter(o => o[1] !== undefined),
    );
};
