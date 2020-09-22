import { SchemaDelegationContext } from './framework/schemaDelegator';

export type GraphQLContext = Readonly<
    {
        legacyToken?: string;
        currency?: string;
        store?: string;
        requestHeaders: Record<string, unknown>;
    } & SchemaDelegationContext
>;

export type ContextFn = (headers: Record<string, unknown>) => GraphQLContext;

export type ContextExtension = (
    context: Readonly<GraphQLContext>,
) => Record<string, unknown> | void;
