/**
 * Prepare resolvers for complex attributes which are stored in storefront with different structure and keys
 */
import {Product} from "../../../../generated/catalog_pb";
import {fillUrlRewriteResolver} from './attribute_resolvers/url_rewrites_resolver';
import {fillDownloadableProductResolver} from './attribute_resolvers/downloadable_product_resolver';

export const storefrontAttributesMapping: string[] = [];

type resolversMap = {
        attribute: string,
        function: (product: Product, context: {}) => void
    }
export const resolvedAttributes: resolversMap[] = [];

/**
 * Initialize resolvers which are stored in './attribute_resolvers' directory
 */
export async function fillResolvers() {
    await fillUrlRewriteResolver();
    await fillDownloadableProductResolver();
}

/**
 * Execute resolver for specified attribute
 *
 * "context" parameter can be used to pass extra data (as request schema e.t.c) for attribute resolver
 *
 * @param product
 * @param attribute
 * @param context
 */
export async function resolveAttribute(product: Product, attribute: string, context: {}) {
    let resolver = resolvedAttributes.find(i => i.attribute === attribute);
    if (resolver === undefined) {
        throw new TypeError('Attribute resolver doesn\'t exist');
    }

    return resolver.function(product, context);
}

