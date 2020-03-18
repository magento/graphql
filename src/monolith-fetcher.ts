import { FetcherOperation } from 'graphql-tools/dist/stitching/makeRemoteExecutableSchema';
import { print } from 'graphql';
import fromentries from 'fromentries';
import { GraphQLContext } from './types';

/**
 * @summary Create a custom "Fetcher" for Apollo Server to use when
 *          calling the Monolith/Legacy Magento GraphQL API (PHP).
 *          Ensures required Magento headers are passed along
 *
 * @see https://devdocs.magento.com/guides/v2.3/graphql/send-request.html#request-headers
 * @see https://www.apollographql.com/docs/graphql-tools/remote-schemas/#fetcher-api
 */
export function createMonolithFetcher(
    monolithGraphQLUrl: string,
    fetch: WindowOrWorkerGlobalScope['fetch'],
) {
    return async (opts: FetcherOperation) => {
        const headers = {
            'Content-Type': 'application/json',
        };
        if (opts.context) {
            const graphqlContext: GraphQLContext = opts.context.graphqlContext;
            Object.assign(headers, monolithHeadersFromContext(graphqlContext));
        }

        const result = await fetch(monolithGraphQLUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                query: print(opts.query),
                variables: opts.variables,
                operationName: opts.operationName,
            }),
        });

        return result.json();
    };
}

/**
 * @summary Generate required headers for the PHP monolith,
 *          using values set per-request on context
 * @see     https://devdocs.magento.com/guides/v2.3/graphql/send-request.html#request-headers
 */
function monolithHeadersFromContext(context: GraphQLContext) {
    // Unlike JSON.stringify, `Headers` (used by `fetch`)
    // does _not_ exclude keys with undefined values
    return excludeUndefinedValues({
        Authorization: context.legacyToken,
        'Content-Currency': context.currency,
        Store: context.store,
    });
}

/**
 * @summary Create a new object, excluding all entries
 *          with an undefined value
 */
const excludeUndefinedValues = <K extends string, V>(obj: Record<K, V>) => {
    const entries = [];
    for (const [key, val] of Object.entries(obj)) {
        if (val !== undefined) {
            entries.push([key, val] as [K, V]);
        }
    }
    return fromentries(entries);
};
