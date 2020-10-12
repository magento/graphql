import { GraphQLSchema } from 'graphql';
import { GraphQLContext, ContextFn } from './types';
import { SchemaDelegator } from './schemaDelegator';

type ContextBuilderInput = {
    schema: GraphQLSchema;
};

/**
 * @summary Builds a new instance of the GraphQLContext
 */
export function contextBuilder({ schema }: ContextBuilderInput): ContextFn {
    const schemaDelegator = new SchemaDelegator(schema);

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
            schemaDelegator,
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
