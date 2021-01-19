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
import { resolveType } from './product_type_resolver';

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
