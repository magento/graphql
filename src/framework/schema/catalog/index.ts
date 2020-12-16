import assert from 'assert';
import { credentials } from 'grpc';
import { promisify } from 'util';
import { FrameworkConfig } from '../../config';
import {NewProducts, Resolvers} from '../../../../generated/graphql';
import {ProductsGetRequest, Product} from '../../../../generated/catalog_pb';
import { CatalogClient } from '../../../../generated/catalog_grpc_pb';
import { Logger } from '../../logger';
import { typeDefs } from './type_defs';
import { resolveType } from './catalog_type_resolver';
import { resolveAttribute, fillResolvers, storefrontAttributesMapping } from './attribute_resolver';
import { graphQlMapping } from './graphql_mapping'

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
    const graphqlFields = require('graphql-fields');

    //Initialize attribute resolvers
    await fillResolvers();

    const resolvers: Resolvers = {
        NewProductInterface: {
            __resolveType(product, context, info){
                // return resolveType(product.type_id);
                // temporary solution as type_id is absent in catalog storefront storage (SFAPP-185)
                return resolveType('downloadable');
            },
        },

        Query: {
            async getProductsByIds(root, args, context, info) {
                const topLevelFields = graphqlFields(info);
                const requestedAttributes: string[] = Object.keys(topLevelFields['items']);
                const msg = new ProductsGetRequest();
                const productsId = [];

                for (const key in args.ids) {
                    if (typeof key !== undefined && args.ids.hasOwnProperty(key)) {
                        productsId.push(args.ids[key] as string);
                    }
                }
                let catalogStorefrontAttributes: string[] = [];

                //Prepare attributes for catalog storefront request
                for (const requestedAttribute of requestedAttributes) {
                    const storefrontAttribute = graphQlMapping.get(requestedAttribute);
                    if (storefrontAttribute === undefined) {
                        catalogStorefrontAttributes.push(requestedAttribute)
                    } else if (!catalogStorefrontAttributes.includes(storefrontAttribute)) {
                        catalogStorefrontAttributes.push(storefrontAttribute)
                    }
                }
                msg.setIdsList(productsId);

                // Add type_id field to request as it's needed for the type resolving
                const requiredFields = [
                    'type_id'
                ];
                catalogStorefrontAttributes = catalogStorefrontAttributes.concat(requiredFields);
                msg.setAttributeCodesList(catalogStorefrontAttributes);
                msg.setStore('default');

                //Prepare resource for catalog storefront request
                const res = await getProducts(msg);
                assert(res, 'Did not receive a response from Catalog gRPC API');

                const products = res.getItemsList();

                const result = {} as NewProducts;
                const items = [];
                context.types = [];
                //Request product data from catalog storefront result
                for (const key in products) {
                    if (typeof key !== undefined && products.hasOwnProperty(key)) {
                        let productData: any = {};
                        for (let attribute of requestedAttributes) {
                            let storefrontValue = undefined;
                            if (storefrontAttributesMapping.includes(attribute))  {
                                // Fill attribute context if any additional data needed
                                let attributeContext = {};
                                storefrontValue = resolveAttribute(products[key], attribute, attributeContext);
                            } else {
                                storefrontValue = getStorefrontValue(attribute, products[key])
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
            }
        }
    };

    return { resolvers, typeDefs };
}

/**
 * Get storefront value by generated method call
 *
 * @param graphQlAttribute
 * @param product
 */
const getStorefrontValue = (graphQlAttribute: string, product: Product) => {
    let method = 'get'+graphQlAttribute.replace(/(^|_)([a-z])/ig, ($1) => {
        return $1.toUpperCase()
            .replace('-', '')
            .replace('_', '');
    })+'()';
    return eval(`product.${ method }`);
};
