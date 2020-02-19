import { FetcherOperation } from 'graphql-tools/dist/stitching/makeRemoteExecutableSchema';
import { print } from 'graphql';

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
            const { graphqlContext } = opts.context;
            Object.assign(headers, {
                Authorization: graphqlContext.legacyToken,
                'Content-Currency': graphqlContext.currency,
                Store: graphqlContext.store,
            });
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
