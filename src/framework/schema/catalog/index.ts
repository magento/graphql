import assert from 'assert';
import { credentials } from 'grpc';
import { promisify } from 'util';
import { FrameworkConfig } from '../../config';
import {
    ProductInterface,
    Products,
    Resolvers,
} from '../../../../generated/graphql';
import { Product, ProductsGetRequest } from '../../../../generated/catalog_pb';
import { CatalogClient } from '../../../../generated/catalog_grpc_pb';
import { Logger } from '../../logger';
import { typeDefs } from './type_defs';
import { getStorefrontAttributeValue } from './storefront_attributes_mapping';
import {
    parseResolveInfo,
    ResolveTree,
    simplifyParsedResolveInfoFragmentWithType,
    FieldsByTypeName,
} from 'graphql-parse-resolve-info';
import { resolveType } from './catalog_type_resolver';
import { attributeResolversList, resolveAttribute } from './attribute_resolver';
import { graphToStorefrontQlMapping } from './graphql_to_storefront_mapping';

type Opts = {
    config: FrameworkConfig;
    logger: Logger;
};

export async function createCatalogSchema({ config, logger }: Opts) {
    const host = config.get('CATALOG_STOREFRONT_HOST').asString();
    const port = config.get('CATALOG_STOREFRONT_PORT').asNumber();
    const client = new CatalogClient(
        `${host}:${port}`,
        credentials.createInsecure(),
    );
    const getProducts = promisify(client.getProducts.bind(client));

    const resolvers: Resolvers = {
        ProductInterface: {
            __resolveType(product, context, info) {
                // TODO: change to: return resolveType(product.type_id);
                // TODO: temporary solution as type_id is absent in catalog storefront storage (SFAPP-185)
                return resolveType('downloadable');
            },
        },

        Query: {
            async getProductsByIds(root, args, context, info) {
                const {
                    fields,
                }: { fields: any } = simplifyParsedResolveInfoFragmentWithType(
                    <ResolveTree>parseResolveInfo(info),
                    info.returnType,
                );

                const requestedAttributes = getRequestedAttributes(fields);
                const catalogStorefrontAttributes = getCatalogStorefrontAttributes(
                    requestedAttributes,
                );
                const msg = new ProductsGetRequest();

                msg.setIdsList(<Array<string>>args.ids);
                msg.setAttributeCodesList(catalogStorefrontAttributes);
                msg.setStore('default');

                //Make request to catalog storefont service
                logger.debug('Sending product request to Catalog gRPC API');
                logger.trace(msg.toObject());
                const res = await getProducts(msg);
                assert(res, 'Did not receive a response from Catalog gRPC API');

                const products = res.getItemsList();
                const result = {} as Products;
                const items = [];
                //Request product data from catalog storefront result
                for (const product of products) {
                    const productData = getProductData(
                        product,
                        requestedAttributes,
                    );
                    items.push(productData);
                }
                result.items = items;

                return result;
            },
        },
    };

    return { resolvers, typeDefs };
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
function getRequestedAttributes(fields: {
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
function getCatalogStorefrontAttributes(requestedAttributes: string[]) {
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
    // TODO: 'type_id' is deprecated - look for something else to use
    const requiredFields = ['type_id'];

    return catalogStorefrontAttributes.concat(requiredFields);
}

/**
 * Get product data from Product object by requested attributes
 *
 * @param product
 * @param requestedAttributes
 */

function getProductData(
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
