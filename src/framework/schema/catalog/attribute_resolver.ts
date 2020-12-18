import { Product } from '../../../../generated/catalog_pb';
import { DownloadableProductResolver } from './attribute_resolvers/downloadable_product_resolver';
import { UrlRewritesResolver } from './attribute_resolvers/url_rewrites_resolver';

export const attributeResolversList: any = {
    downloadable_product_samples: 'downloadable',
    downloadable_product_links: 'downloadable',
    url_rewrites: 'url_rewrites',
};

const attributesToResolve = {
    downloadable: DownloadableProductResolver,
    url_rewrites: UrlRewritesResolver,
};

/**
 * Execute resolver for specified attribute
 *
 * "context" parameter can be used to pass extra data (as request schema e.t.c) for attribute resolver
 *
 * @param product
 * @param attribute
 */
export function resolveAttribute(product: Product, attribute: string) {
    const resolverName = attributeResolversList[attribute];
    if (hasKey(attributesToResolve, resolverName)) {
        const resolver = new attributesToResolve[resolverName]();
        return resolver.resolveAttribute(product, attribute);
    }
}

/**
 * Check is object has a key
 *
 * @param object
 * @param key
 */
function hasKey<Object>(object: Object, key: keyof any): key is keyof Object {
    return key in object;
}
