/**
 * Resolver for url rewrite attributes
 */
import {
    Product,
    UrlRewriteParameter,
} from '../../../../../generated/catalog_pb';
import { Resolver } from './resolver_interface';

export class UrlRewritesResolver implements Resolver {
    /**
     * Execute resolver for specified attribute
     *
     * "context" parameter can be used to pass extra data (as request schema e.t.c) for attribute resolver
     *
     * @param product
     * @param attribute
     */
    public resolveAttribute(product: Product, attribute: string): any[] {
        return this.resolveUrlRewrites(product);
    }

    /**
     * Prepare data for url rewrite attributes
     *
     * @param product
     */
    private resolveUrlRewrites(product: Product) {
        let result = [];
        for (let rewrite of product.getUrlRewritesList()) {
            let rewritesList = {
                url: rewrite.getUrl(),
                parameters: getRewriteParameters(rewrite.getParametersList()),
            };
            result.push(rewritesList);
        }

        function getRewriteParameters(
            urlRewriteParameters: UrlRewriteParameter[],
        ) {
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
        return result;
    }
}
