import { GraphQLSchema } from 'graphql';
import { GraphQLContext, ContextFn } from './types';
import { Logger } from './logger';

type ContextBuilderInput = {
    schema: GraphQLSchema;
    logger: Logger;
};

/**
 * @summary Builds a new instance of the GraphQLContext, with common data
 *          needed by > 1 subschema
 */
export function contextBuilder({ schema }: ContextBuilderInput): ContextFn {
    return (headers: Record<string, unknown>): GraphQLContext => {
        const monolithToken = tokenFromAuthHeader(
            headers.authorization as string,
        );
        const currency = headers['Content-Currency'] as string | undefined;
        const store = headers.Store as string | undefined;

        return {
            monolithToken,
            currency,
            store,
            requestHeaders: headers,
        };
    };
}

function tokenFromAuthHeader(authHeader: string | undefined) {
    if (typeof authHeader !== 'string') {
        return;
    }

    const matches = authHeader.match(/Bearer\s+(.+)/);
    if (matches && matches[1]) {
        return matches[1];
    }
}
