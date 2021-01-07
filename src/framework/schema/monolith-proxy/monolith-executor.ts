import { AsyncExecutor, ExecutionParams } from 'graphql-tools';
import { print } from 'graphql';
import { GraphQLContext } from '../../types';
import { default as nodeFetch } from 'node-fetch';
import { Logger } from '../../logger';

type Opts = {
    /**
     * @summary Absolute URL of monolith GraphQL endpoint
     */
    monolithGraphQLURL: string;
    logger: Logger;
    /**
     * @summary Optionally override the default fetch client
     */
    fetch?: WindowOrWorkerGlobalScope['fetch'] | typeof nodeFetch;
};

/**
 * @summary Create a custom "executor" for wrapSchema to use
 *          when calling the monolith Magento GraphQL API (PHP).
 *          Ensures required Magento headers are passed along
 *
 * @see https://devdocs.magento.com/guides/v2.3/graphql/send-request.html#request-headers
 * @see https://www.graphql-tools.com/docs/remote-schemas#wrapschemaschemaconfig
 */
export function createMonolithExecutor({
    monolithGraphQLURL,
    logger,
    fetch = nodeFetch,
}: Opts): AsyncExecutor {
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

        const printedQuery = print(opts.document);
        logger.debug(`Proxying operation to monolith schema`);
        logger.trace(printedQuery);

        // TODO: Re-write queries (not mutations) to GET where possible,
        //       to hit varnish for some warm cache wins
        const result = await fetch(monolithGraphQLURL, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                query: printedQuery,
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
