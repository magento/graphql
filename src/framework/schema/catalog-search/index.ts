import { SubschemaConfig } from 'graphql-tools';
import { FrameworkConfig } from '../../config';
import { Logger } from '../../logger';
import {
    Filter,
    ProductSearchRequest,
    SearchRange,
    Sort,
} from '../../../../generated/search_pb';
import assert from 'assert';
import {
    FilterEqualTypeInput,
    FilterMatchTypeInput,
    FilterRangeTypeInput,
    ProductAttributeFilterInput,
    ProductAttributeSortInput,
    ProductInterface,
    Products,
    SortEnum,
} from '../../../../generated/graphql';
import { credentials } from 'grpc';
import { promisify } from 'util';
import { SearchClient } from '../../../../generated/search_grpc_pb';
import { GraphQLSchema } from 'graphql';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs } from './type_defs';
import { resolveType } from './product_type_resolver';

// Incoming options which are needed to create Search GraphQl schema
type Opts = {
    config: FrameworkConfig;
    logger: Logger;
};

/**
 * Prepare search GraphQl schema
 *
 * @param config
 * @param logger
 */
export async function searchSchema({ config, logger }: Opts) {
    // Prepare credentials and URL for storefront search client
    const host = config.get('SEARCH_STOREFRONT_HOST').asString();
    const port = config.get('SEARCH_STOREFRONT_PORT').asNumber();
    const client = new SearchClient(
        `${host}:${port}`,
        credentials.createInsecure(),
    );
    const searchProducts = promisify(client.searchProducts.bind(client));

    // Create GraphQl schema
    let searchSchema: GraphQLSchema | SubschemaConfig = makeExecutableSchema({
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
                // Create resolver for "products" fields which will delegate call to catalog "getProductsByIds" method and retrieve products data through that
                productsSearch: async function(root, args, context, info) {
                    // Prepare storefront sel0arch client request
                    const msg = new ProductSearchRequest();

                    const {
                        filter,
                        sort,
                        search,
                        currentPage,
                        pageSize,
                    } = args;
                    if (typeof search === 'string' && sort !== null) {
                        msg.setPhrase(search);
                    }

                    if (typeof filter === 'object' && sort !== null) {
                        msg.addFilters(getFilter(filter));
                    }
                    if (typeof sort === 'object' && sort !== null) {
                        msg.setSortList(getSortingOrder(sort));
                    }
                    if (currentPage) {
                        msg.setCurrentPage(currentPage);
                    }
                    if (pageSize) {
                        msg.setPageSize(pageSize);
                    }

                    // Set actual store where products should be searched
                    //TODO: (SFAPP-258) Store should be taken by code ("default")
                    //TODO: (SFAPP-277) Add store code resolving logic to search resolver and pass it to other resolvers (e.g. Catalog)
                    msg.setStore('1');

                    //Make request to storefront search service
                    logger.debug('Sending search request to Search gRPC API');
                    logger.trace(msg.toObject());
                    const res = await searchProducts(msg);
                    assert(
                        res,
                        'Did not receive a response from Catalog gRPC API',
                    );

                    const products = res.getItemsList();
                    const result = {} as Products;
                    const items = [];

                    //Request product ids data from storefront search result
                    for (const product of products) {
                        let productData = {} as ProductInterface;
                        Object.assign(productData, {
                            id: <number>(<unknown>product),
                        });

                        items.push(productData);
                    }
                    // prepare result with product ids
                    result.items = items;

                    return result;
                },
            },
        },
    });

    return {
        schema: searchSchema,
    };
}

/**
 * Get sorting order for Storefront Search API
 *
 * @param sort
 */
function getSortingOrder(sort: ProductAttributeSortInput): Sort[] {
    let sorting: Sort[] = [];
    for (let [attribute, direction] of Object.entries(sort)) {
        const sortArgument = new Sort();
        sortArgument.setAttribute(attribute);
        sortArgument.setDirection(<SortEnum>direction);
        sorting.push(sortArgument);
    }

    return sorting;
}

/**
 * Get search filter for Storefront search API
 *
 * @param filter
 */
function getFilter(filter: ProductAttributeFilterInput | null): Filter {
    let searchFilter = new Filter();

    if (filter !== null) {
        for (let [key, value] of Object.entries(filter)) {
            searchFilter.setAttribute(key);
            switch (key) {
                case 'sku' || 'category_id' || 'url_key': {
                    const { in: inScope, eq: equals } = <FilterEqualTypeInput>(
                        value
                    );
                    if (equals) {
                        searchFilter.setEq(equals);
                    }
                    if (inScope) {
                        searchFilter.setInList(<Array<string>>inScope);
                    }
                    break;
                }
                case 'name' || 'description' || 'short_description': {
                    const { match } = <FilterMatchTypeInput>value;
                    if (match) {
                        searchFilter.addIn(match);
                    }
                    break;
                }
                case 'price': {
                    const { from: rangeFrom, to: rangeTo } = <
                        FilterRangeTypeInput
                    >value;
                    const searchRange = new SearchRange();

                    if (rangeFrom) {
                        searchRange.setFrom(Number(rangeFrom));
                    }
                    if (rangeTo) {
                        searchRange.setTo(Number(rangeTo));
                    }
                    searchFilter.setRange(searchRange);
                    break;
                }
                default: {
                    break;
                }
            }
        }
    }

    return searchFilter;
}
