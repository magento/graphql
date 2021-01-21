import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs } from './type_defs';
import { FrameworkConfig } from '../../config';
import { Logger } from '../../logger';
import {
    FieldsByTypeName,
    parseResolveInfo,
    ResolveTree,
    simplifyParsedResolveInfoFragmentWithType,
} from 'graphql-parse-resolve-info';
import { Product, ProductsGetRequest } from '../../../../generated/catalog_pb';
import assert from 'assert';
import { ProductInterface, Products } from '../../../../generated/graphql';
import { getStorefrontAttributeValue } from './storefront_attributes_mapping';
import { graphToStorefrontQlMapping } from './graphql_to_storefront_mapping';
import { attributeResolversList, resolveAttribute } from './attribute_resolver';
import { CatalogClient } from '../../../../generated/catalog_grpc_pb';
import { credentials } from 'grpc';
import { promisify } from 'util';
import {
    GraphQLResolveInfo,
    GraphQLSchema,
    Kind,
    SelectionSetNode,
} from 'graphql';
import {
    batchDelegateToSchema,
    delegateToSchema,
    SubschemaConfig,
    TransformQuery,
} from 'graphql-tools';
import { resolveType } from '../catalog-search/product_type_resolver';

type Opts = {
    config: FrameworkConfig;
    logger: Logger;
};

/**
 * Prepare GraphQl schema for catalog service
 *
 * @param config
 * @param logger
 */
export async function catalogSchema({ config, logger }: Opts) {
    // Prepare catalog storefront client
    const host = config.get('CATALOG_STOREFRONT_HOST').asString();
    const port = config.get('CATALOG_STOREFRONT_PORT').asNumber();
    const client = new CatalogClient(
        `${host}:${port}`,
        credentials.createInsecure(),
    );
    const getProducts = promisify(client.getProducts.bind(client));

    // Create GQL schema
    // TODO: (SFAPP-275) Currently to make resolvers merging (realized in graphql/src/framework/schema/monolith-proxy/index.ts) work we creating new schema with single resolver "getProductsByIds"
    let catalogSchema = makeExecutableSchema({
        typeDefs: typeDefs,
        resolvers: {
            // Resolver for product types
            ProductInterface: {
                __resolveType() {
                    // TODO: (SFAPP-278, SFAPP-185) change to: return resolveType(product.type_id);
                    // TODO: temporary solution as type_id is absent in catalog storefront storage (SFAPP-185)
                    // TODO: possibly we need to resolve product type during products search to make an ability for schemas merging
                    return resolveType('simple');
                },
            },

            Query: {
                // Resolver which retrieves products data (compatible with ProductInterface) by their ids
                async getProductsByIds(root, args, context, info) {
                    // Get passed to resolver fields in format which is easy to parse
                    const {
                        fields,
                    }: {
                        fields: any;
                    } = simplifyParsedResolveInfoFragmentWithType(
                        <ResolveTree>parseResolveInfo(info),
                        info.returnType,
                    );

                    const requestedAttributes = getRequestedAttributesList(
                        fields,
                    );
                    const catalogStorefrontAttributes = getCatalogStorefrontAttributesList(
                        requestedAttributes,
                    );

                    //Prepare request to catalog storefront API
                    const msg = new ProductsGetRequest();
                    msg.setIdsList(<Array<string>>args.ids);
                    msg.setAttributeCodesList(catalogStorefrontAttributes);
                    //TODO: (SFAPP-277) Add store code resolving logic to catalog resolver
                    msg.setStore('default');

                    //Make request to catalog storefont service
                    logger.debug('Sending product request to Catalog gRPC API');
                    logger.trace(msg.toObject());
                    const res = await getProducts(msg);
                    assert(
                        res,
                        'Did not receive a response from Catalog gRPC API',
                    );
                    const products = res.getItemsList();
                    const result = {} as Products;
                    const items = [];

                    //Request product data from catalog storefront result
                    for (const product of products) {
                        const productData = getProductDataByAttributes(
                            product,
                            requestedAttributes,
                        );
                        items.push(productData);
                    }
                    // prepare result with product data
                    result.items = items;

                    return result;
                },
            },
        },
    });

    return {
        schema: catalogSchema,
        merge: {
            // TODO: (SFAPP-279) Merge products data by ProductInterface type (not by specific type SimpleProduct)
            SimpleProduct: {
                // Make sure the `id` field is always fetched from other services,
                // to ensure we can use it for a lookup in the monolith
                selectionSet: '{ id }',
                // Track for caching/deduping based on sku
                key: (obj: { id: string }) => obj.id,
                // TODO: This `resolve` function and manual usage of `batchDelegateToSchema`
                //       is a necessary hack right now to allow type-merging to delegate
                //       to root queries that return more than just a single list type.
                //
                //       There should be a cleaner way to support this pattern, and I've logged
                //       a GH issue with graphql-tools looking for a better option
                //       https://github.com/ardatan/graphql-tools/issues/2438
                resolve(
                    _originalResult: any,
                    context: any,
                    info: GraphQLResolveInfo,
                    subschema: GraphQLSchema | SubschemaConfig,
                    selectionSet: SelectionSetNode,
                    key: string | number,
                ) {
                    return batchDelegateToSchema({
                        schema: subschema,
                        operation: 'query',
                        fieldName: 'getProductsByIds',
                        key,
                        // Generate the arguments object for the `Query.products` operation
                        // we will send to the monolith
                        argsFromKeys: (ids: readonly string[]) => ({
                            ids: ids,
                        }),
                        selectionSet,
                        context,
                        info,
                        // We've landed here from a merged type resolver - must skip
                        // here or we'll end up in an infinite loop
                        skipTypeMerging: true,
                        transforms: [
                            // Search service returns the `Products` type from `Query.products`,
                            // but graphql-tools type merging wants `Query.products` to return
                            // just a [ProductInterface]. To work-around this for now, we use
                            // a transform query, and hoist the results of the `Product.items`
                            // field to be the only result from `Query.products`.
                            new TransformQuery({
                                // Look for `Query.products`
                                path: ['getProductsByIds'],
                                queryTransformer: subtree => ({
                                    kind: Kind.SELECTION_SET,
                                    selections: [
                                        {
                                            kind: Kind.FIELD,
                                            name: {
                                                kind: Kind.NAME,
                                                value: 'items',
                                            },
                                            selectionSet: subtree,
                                        },
                                    ],
                                }),
                                resultTransformer(result) {
                                    // Only return the items, not the wrapper
                                    // with paging info
                                    return result?.items || [];
                                },
                            }),
                        ],
                    });
                },
            },
        },
    };
}

/**
 * Get storefront value by generated method call
 *
 * @param graphQlAttribute
 * @param product
 */
function getStorefrontValue(graphQlAttribute: string, product: Product) {
    const attribute = graphQlAttribute.replace(/(_)([a-z])/gi, $1 => {
        return $1
            .toUpperCase()
            .replace('-', '')
            .replace('_', '');
    });

    return getStorefrontAttributeValue(attribute, product);
}

/**
 * Get requested attributes by parsed resolve info fragment
 *
 * @param fields
 */
function getRequestedAttributesList(fields: {
    items: { fieldsByTypeName: FieldsByTypeName };
}): string[] {
    let result: string[] = [];

    if (fields.hasOwnProperty('items')) {
        if (
            fields.hasOwnProperty('items') &&
            fields.items.hasOwnProperty('fieldsByTypeName')
        ) {
            let requestedType: [];
            for (requestedType of getObjectValues(
                fields.items.fieldsByTypeName,
            )) {
                let requestedField: ResolveTree;
                for (requestedField of Object.values(requestedType)) {
                    result.push(requestedField.name);
                }
            }
        }
    }

    return result;
}

/**
 * Get object values for provided object
 *
 * @param object
 */
function getObjectValues(object: Object): any[] {
    const result = [];
    for (const requestedField of Object.values(object)) {
        result.push(requestedField);
    }

    return result;
}

/**
 * Get list of catalog storefront attribute names by requested in GraphQl attributes list
 *
 * @param requestedAttributes
 */
function getCatalogStorefrontAttributesList(requestedAttributes: string[]) {
    let catalogStorefrontAttributes: string[] = [];
    //Prepare attributes for catalog storefront request
    for (const requestedAttribute of requestedAttributes) {
        const storefrontAttribute = graphToStorefrontQlMapping.get(
            requestedAttribute,
        );
        if (
            storefrontAttribute !== undefined &&
            !catalogStorefrontAttributes.includes(storefrontAttribute)
        ) {
            catalogStorefrontAttributes.push(storefrontAttribute);
        } else {
            catalogStorefrontAttributes.push(requestedAttribute);
        }
    }
    // Add type_id field to request as it's needed for the type resolving
    // TODO: (SFAPP-185) 'type_id' is deprecated - look for something else to use
    const requiredFields = ['type_id'];

    return catalogStorefrontAttributes.concat(requiredFields);
}

/**
 * Get product data from Product object by requested attributes
 *
 * @param product
 * @param requestedAttributes
 */
function getProductDataByAttributes(
    product: Product,
    requestedAttributes: string[],
): ProductInterface {
    let productData = {} as ProductInterface;

    for (let attribute of requestedAttributes) {
        let storefrontValue = undefined;
        if (attributeResolversList.hasOwnProperty(attribute)) {
            storefrontValue = resolveAttribute(product, attribute);
        } else {
            storefrontValue = getStorefrontValue(attribute, product);
        }

        Object.assign(productData, { [attribute]: storefrontValue });
    }
    return productData;
}
