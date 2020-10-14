import { SchemaDelegationContext } from './schemaDelegator';

export type GraphQLContext = Readonly<
    {
        monolithToken?: string;
        currency?: string;
        store?: string;
        requestHeaders: Record<string, unknown>;
    } & SchemaDelegationContext
>;

export type ContextFn = (headers: Record<string, unknown>) => GraphQLContext;
