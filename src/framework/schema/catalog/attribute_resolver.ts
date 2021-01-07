import { Product } from '../../../../generated/catalog_pb';
import { resolveDownloadableAttribute } from './attribute_resolvers/downloadable_product_resolver';
import { resolveUrlRewritesAttribute } from './attribute_resolvers/url_rewrites_resolver';

export const attributeResolversList: { [key: string]: string } = {
    downloadable_product_samples: 'downloadable',
    downloadable_product_links: 'downloadable',
    url_rewrites: 'url_rewrites',
};

const attributesToResolve: { [key: string]: Function } = {
    downloadable: resolveDownloadableAttribute,
    url_rewrites: resolveUrlRewritesAttribute,
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
    if (attributesToResolve.hasOwnProperty(resolverName)) {
        const resolver = attributesToResolve[resolverName];
        return resolver(product, attribute);
    }
}
