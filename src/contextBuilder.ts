import { GraphQLContext } from './types';
import { GQLPackage } from './localPackages';

type ContextBuilderInput = {
    headers: Record<string, unknown>;
    extensions: Record<string, GQLPackage>;
};

/**
 * @summary Builds a new instance of the GraphQLContext,
 *          with additions from local extensions
 */
export function contextBuilder({
    extensions,
    headers,
}: ContextBuilderInput): GraphQLContext {
    const legacyToken = headers.authorization as string | undefined;
    const currency = headers['Content-Currency'] as string | undefined;
    const store = headers.Store as string | undefined;

    // TODO: In dev mode, use Object.seal to prevent
    // mutations to baseContext
    const baseContext = { legacyToken, currency, store };
    // We don't want an extension setup func to rely
    // on context values from other extension setup funcs,
    // because it would create an implicit dependency on extension
    // execution order, which is currently random.
    const finalContext = { ...baseContext };
    for (const extension of Object.values(extensions)) {
        if (!extension.context) continue;

        const contextResult = {
            // additions to context are namespaced to prevent collisions
            [extension.name]: extension.context(baseContext),
        };
        Object.assign(finalContext, contextResult);
    }

    return finalContext;
}
