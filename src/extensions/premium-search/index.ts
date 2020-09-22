import { createExtension } from '../../api';
import gql from 'graphql-tag';
import {
    introspectSchema,
    wrapSchema,
    RenameTypes,
    TransformObjectFields,
    WrapQuery,
} from 'graphql-tools';
import {
    GraphQLSchema,
    GraphQLInterfaceType,
    GraphQLNonNull,
    Kind,
} from 'graphql';
import { createSearchExecutor } from './executor';
import { GraphQLContext } from '../../types';
import {
    IResolvers,
    Products,
    ProductInterface,
} from '../../../generated/graphql';

const extensionConfig = {
    PREMIUM_SEARCH_GRAPHQL_URL: {
        docs: 'Absolute URL of Premium Search GraphQL endpoint',
    },
    PREMIUM_SEARCH_API_KEY: {
        docs: 'Key passed to Premium Search using "X-API-KEY" header',
    },
};

export default createExtension(extensionConfig, async (config, api) => {
    const searchURL = config.get('PREMIUM_SEARCH_GRAPHQL_URL').asString();
    const apiKey = config.get('PREMIUM_SEARCH_API_KEY').asString();
    const executor = createSearchExecutor(searchURL, apiKey);
    let searchSchema: GraphQLSchema;

    try {
        searchSchema = await introspectSchema(executor);
    } catch (err) {
        throw new Error('Failed introspecting remote Search Schema');
    }

    const transformedSchema = wrapSchema({ schema: searchSchema, executor }, [
        // Prevent conflict with Magento Core's "Price" type
        new RenameTypes(name => {
            if (name === 'Price') return 'ProductItemPrice';
        }),

        // Use Magento Core's `ProductInterface` instead of Search's `ProductItem` type
        new TransformObjectFields((typeName, fieldName, fieldConfig) => {
            if (typeName === 'ProductSearchItem' && fieldName === 'product') {
                return {
                    ...fieldConfig,
                    type: new GraphQLNonNull(
                        new GraphQLInterfaceType({
                            name: 'ProductInterface',
                            // Fields from `ProductInterface` will be merged
                            // in by the framework
                            fields: () => ({}),
                        }),
                    ),
                };
            }
        }),
    ]);

    const typeDefs = gql`
        # Minimal copy of types from Search Service. Only includes types
        # we're overriding
        type ProductSearchItem {
            product: ProductInterface!
        }
    `;

    const resolvers: IResolvers<GraphQLContext> = {
        // Note: This stitching resolver can go away entirely if search starts returning
        // a `ProductInterface` subset, instead of the `ProductItem` type
        ProductSearchItem: {
            // Note: This currently triggers N+1 calls to the monolith,
            // TODO: Batching
            product: {
                // Note: `selectionSet` won't work until proper schema
                // stitching is in place (we only merge atm)
                selectionSet: '{ product { name } }',
                async resolve(parent, args, context, info) {
                    if (!parent.product.sku) {
                        // TODO: Will hit this if client does not select the `sku` field.
                        // Needs to be added to the selection set
                        throw new Error(
                            'Until Schema Stitching is properly implemented, ' +
                                'you must select the "sku" field from "Query.productSearch"',
                        );
                    }

                    const result = await context.schemaDelegator.delegate(
                        'query',
                        {
                            fieldName: 'products',
                            args: {
                                filter: {
                                    sku: { eq: parent.product.sku },
                                },
                                pageSize: 1,
                                currentPage: 1,
                            },
                            info,
                            transforms: [
                                new WrapQuery(
                                    ['products'],
                                    subtree => {
                                        // Inject a selection of the "items" field
                                        // for the remote query
                                        return {
                                            kind: Kind.FIELD,
                                            name: {
                                                kind: Kind.NAME,
                                                value: 'items',
                                            },
                                            // Move selected ProductInterface fields from
                                            // request to a subtree of the "items" field
                                            selectionSet: subtree,
                                        };
                                    },
                                    (result: Products) =>
                                        result &&
                                        result.items &&
                                        result.items[0],
                                ),
                            ],
                        },
                    );

                    if (!result) {
                        throw new Error(
                            `Could not find product with sku "${parent.product.sku}"`,
                        );
                    }
                    // Yuck
                    return (result as any) as ProductInterface;
                },
            },
        },
    };

    api.addSchema(transformedSchema)
        .addTypeDefs(typeDefs)
        .addResolvers(resolvers);
});
