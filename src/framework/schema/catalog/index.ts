import assert from 'assert';
import { credentials } from 'grpc';
import { promisify } from 'util';
import { FrameworkConfig } from '../../config';
import { NewProducts, Resolvers } from '../../../../generated/graphql';
import { ProductsGetRequest, Product } from '../../../../generated/catalog_pb';
import { CatalogClient } from '../../../../generated/catalog_grpc_pb';
import { Logger } from '../../logger';
import { typeDefs } from './type_defs';
import { getStorefrontAttributeValue } from './storefront_attributes_mapping';
import {
    parseResolveInfo,
    simplifyParsedResolveInfoFragmentWithType,
    ResolveTree,
} from 'graphql-parse-resolve-info';
import { resolveType } from './catalog_type_resolver';
import { resolveAttribute, attributeResolversList } from './attribute_resolver';
import { graphToStorefrontQlMapping } from './graphql_to_storefront_mapping';

type Opts = {
    config: FrameworkConfig;
    logger: Logger;
};

export async function createCatalogSchema({ config }: Opts) {
    const host = config.get('CATALOG_STOREFRONT_HOST').asString();
    const port = config.get('CATALOG_STOREFRONT_PORT').asNumber();
    const client = new CatalogClient(
        `${host}:${port}`,
        credentials.createInsecure(),
    );
    const getProducts = promisify(client.getProducts.bind(client));

    const resolvers: Resolvers = {
        NewProductInterface: {
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
                }: any = simplifyParsedResolveInfoFragmentWithType(
                    <ResolveTree>parseResolveInfo(info),
                    info.returnType,
                );
                let requestedAttributes = getRequestedAttributes(fields);

                const msg = new ProductsGetRequest();
                const productsId = [];

                for (const productId of args.ids) {
                    productsId.push(productId as string);
                }
                let catalogStorefrontAttributes: string[] = [];

                //Prepare attributes for catalog storefront request
                for (const requestedAttribute of requestedAttributes) {
                    const storefrontAttribute = graphToStorefrontQlMapping.get(
                        requestedAttribute,
                    );
                    if (storefrontAttribute === undefined) {
                        catalogStorefrontAttributes.push(requestedAttribute);
                    } else if (
                        !catalogStorefrontAttributes.includes(
                            storefrontAttribute,
                        )
                    ) {
                        catalogStorefrontAttributes.push(storefrontAttribute);
                    }
                }
                msg.setIdsList(productsId);

                // Add type_id field to request as it's needed for the type resolving
                const requiredFields = ['type_id'];
                catalogStorefrontAttributes = catalogStorefrontAttributes.concat(
                    requiredFields,
                );
                msg.setAttributeCodesList(catalogStorefrontAttributes);
                msg.setStore('default');

                //Make request to catalog storefont service
                const res = await getProducts(msg);
                assert(res, 'Did not receive a response from Catalog gRPC API');

                const products = res.getItemsList();

                const result = {} as NewProducts;
                const items = [];
                context.types = [];
                //Request product data from catalog storefront result
                for (const key in products) {
                    if (
                        typeof key !== undefined &&
                        products.hasOwnProperty(key)
                    ) {
                        let productData: any = {};
                        for (let attribute of requestedAttributes) {
                            let storefrontValue = undefined;
                            if (
                                attributeResolversList.hasOwnProperty(attribute)
                            ) {
                                storefrontValue = resolveAttribute(
                                    products[key],
                                    attribute,
                                );
                            } else {
                                storefrontValue = getStorefrontValue(
                                    attribute,
                                    products[key],
                                );
                            }
                            if (typeof storefrontValue !== undefined) {
                                productData[attribute] = storefrontValue;
                            }
                        }
                        items.push(productData);
                    }
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
function getRequestedAttributes(fields: any) {
    let result: any[] = [];
    if (fields.hasOwnProperty('items')) {
        for (const requestedType of getObjectValues(
            fields.items.fieldsByTypeName,
        )) {
            for (const requestedField of getObjectValues(requestedType)) {
                result.push(requestedField.name);
            }
        }
    }

    function getObjectValues(object: Object) {
        const result = [];
        for (const requestedField of Object.values(object)) {
            result.push(requestedField);
        }

        return result;
    }

    return result;
}
