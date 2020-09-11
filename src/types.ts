export type GraphQLContext<T extends object = {}> = T &
    Readonly<{
        legacyToken?: string;
        currency?: string;
        store?: string;
        requestHeaders: Record<string, unknown>;
    }>;

export type ContextFn = (headers: Record<string, unknown>) => GraphQLContext;

export type ContextExtension = (
    context: Readonly<GraphQLContext>,
) => Record<string, unknown> | void;
