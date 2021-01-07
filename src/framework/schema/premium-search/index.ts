import { FrameworkConfig } from '../../config';
import {
    introspectSchema,
    TransformInterfaceFields,
    FilterInterfaceFields,
} from 'graphql-tools';
import { GraphQLSchema } from 'graphql';
import { createSearchExecutor } from './executor';
import { Logger } from '../../logger';

type Opts = {
    config: FrameworkConfig;
    logger: Logger;
};

export async function createPremiumSearchSchema({ config, logger }: Opts) {
    const searchURL = config.get('PREMIUM_SEARCH_GRAPHQL_URL').asString();
    const apiKey = config.get('PREMIUM_SEARCH_API_KEY').asString();
    const executor = createSearchExecutor({ searchURL, apiKey, logger });
    let searchSchema: GraphQLSchema;

    try {
        logger.info(`Fetching Premium Search schema from ${searchURL}`);
        searchSchema = await introspectSchema(executor);
    } catch (err) {
        throw new Error(
            `Failed introspecting remote Search Schema at "${searchURL}"`,
        );
    }

    const schemaConfig = {
        schema: searchSchema,
        executor,
        // Note: Transforms always run at least twice (weird, I know).
        // https://github.com/ardatan/graphql-tools/blob/cdfe6bed418c8496d3223b98e465987dc34bef75/packages/wrap/src/wrapSchema.ts#L34-L37
        // In the linked code, `generateProxyingResolvers` and `applySchemaTransforms` both run the transforms below. Will lead to dupe logs,
        // but not the end of the world
        transforms: [
            new FilterInterfaceFields((typeName, fieldName) => {
                const isUID =
                    typeName === 'ProductInterface' && fieldName === 'uid';
                return !isUID;
            }),

            // Remove deprecation flag from ProductInterface.id, set by remote
            // search schema
            new TransformInterfaceFields((typeName, fieldName, fieldConfig) => {
                const isProductID =
                    typeName === 'ProductInterface' && fieldName === 'id';
                if (isProductID) {
                    return { ...fieldConfig, deprecationReason: null };
                }
            }),

            // Search service adds a `custom_attributes` field,
            // but derived types in Magento monolith do not have
            // that field, leading to an invalid schema
            new FilterInterfaceFields((typeName, fieldName) => {
                const isCustomAttributes =
                    typeName === 'ProductInterface' &&
                    fieldName === 'custom_attributes';
                return !isCustomAttributes;
            }),
        ],
    };

    return schemaConfig;
}
