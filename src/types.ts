import { DocumentNode, GraphQLSchema } from 'graphql';
import { IResolvers } from '../generated/graphql';

export type GraphQLContext<T extends object = {}> = T &
    Readonly<{
        legacyToken?: string;
        currency?: string;
        store?: string;
    }>;

export type ContextExtension = (
    context: Readonly<GraphQLContext>,
) => Record<string, unknown> | void;

export type ExtensionAPI = Readonly<{
    addTypeDefs: (defs: DocumentNode) => ExtensionAPI;
    addResolvers: (resolvers: IResolvers) => ExtensionAPI;
    addSchema: (schema: GraphQLSchema) => ExtensionAPI;
    extendContext: (contextExtension: ContextExtension) => ExtensionAPI;
}>;
