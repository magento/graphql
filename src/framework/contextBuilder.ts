import { GraphQLSchema } from 'graphql';
import { GraphQLContext, ContextFn } from '../types';
import { LocalGQLExtension } from './localExtensions';
import { SchemaDelegator } from './schemaDelegator';

type ContextBuilderInput = {
    schema: GraphQLSchema;
    extensions: LocalGQLExtension[];
};

/**
 * @summary Builds a new instance of the GraphQLContext,
 *          with additions from local extensions
 */
export function contextBuilder({
    extensions,
    schema,
}: ContextBuilderInput): ContextFn {
    const schemaDelegator = new SchemaDelegator(schema);

    return (headers: Record<string, unknown>): GraphQLContext => {
        const legacyToken = tokenFromAuthHeader(
            headers.authorization as string,
        );
        const currency = headers['Content-Currency'] as string | undefined;
        const store = headers.Store as string | undefined;

        const baseContext: GraphQLContext = {
            legacyToken,
            currency,
            store,
            requestHeaders: headers,
            schemaDelegator,
        };

        // Copy `baseContext` before handing it out to extension `context`
        // functions to ensure any accidental mutations aren't seen by
        // other extensions
        const finalContext = { ...baseContext };
        for (const extension of extensions) {
            if (!extension.context) continue;

            const contextResult = {
                [extension.name]: extension.context(baseContext),
            };
            // additions to context are merged in with a namespace
            // to prevent collisions between extensions
            Object.assign(finalContext, contextResult);
        }

        return finalContext;
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
