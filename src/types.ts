export type GraphQLContext<T extends object = {}> = T & {
    legacyToken?: string;
    currency?: string;
    store?: string;
};

export type ContextExtension = (
    context: Readonly<GraphQLContext>,
) => Record<string, unknown>;
