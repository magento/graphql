/**
 * Resolver for url rewrite attributes
 */
import {Product, UrlRewriteParameter} from "../../../../../generated/catalog_pb";
import {resolvedAttributes, storefrontAttributesMapping} from '../attribute_resolver'

/**
 * Fill attribute resolvers handler by url rewrites resolver
 */
export async function fillUrlRewriteResolver() {
    let attributeCode = 'url_rewrites';
    storefrontAttributesMapping.push(attributeCode);
    if (!resolvedAttributes.find(i => i.attribute === attributeCode)) {
        resolvedAttributes.push({attribute:attributeCode, function:resolveUrlRewrites});
    }
}

/**
 * Prepare data for url rewrite attributes
 *
 * @param product
 */
async function resolveUrlRewrites(product: Product) {
    let result = [];
    for (let rewrite of product.getUrlRewritesList()) {
        let rewritesList = {
            url: rewrite.getUrl(),
            parameters: getRewriteParameters(rewrite.getParametersList())
        }
        result.push(rewritesList);
    }

    function getRewriteParameters(urlRewriteParameters: UrlRewriteParameter[]) {
        let rewriteParameters = [];
        let params: any = {};
        for (let rewriteParameter of urlRewriteParameters) {
            params = {
                name: rewriteParameter.getName(),
                value: rewriteParameter.getValue()
            };
        }
        rewriteParameters.push(params);
        return rewriteParameters;
    }
    return result;
}
