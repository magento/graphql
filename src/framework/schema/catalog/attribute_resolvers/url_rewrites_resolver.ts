/**
 * Resolver for url rewrite attributes
 */
import {
    Product,
    UrlRewriteParameter,
} from '../../../../../generated/catalog_pb';

/**
 * Execute resolver for url rewrites attribute
 *
 * @param product
 * @param attribute
 */
export function resolveUrlRewritesAttribute(
    product: Product,
    attribute: string,
): {}[] {
    let result = [];
    for (let rewrite of product.getUrlRewritesList()) {
        let rewritesList = {
            url: rewrite.getUrl(),
            parameters: getRewriteParameters(rewrite.getParametersList()),
        };
        result.push(rewritesList);
    }
    return result;
}

function getRewriteParameters(
    urlRewriteParameters: UrlRewriteParameter[],
): {}[] {
    let rewriteParameters = [];
    let params: any = {};
    for (let rewriteParameter of urlRewriteParameters) {
        params = {
            name: rewriteParameter.getName(),
            value: rewriteParameter.getValue(),
        };
    }
    rewriteParameters.push(params);
    return rewriteParameters;
}
