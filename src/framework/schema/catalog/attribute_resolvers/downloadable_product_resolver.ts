/**
 * Resolver for downloadable product attributes
 */
import {
    MediaResource,
    Product,
    ProductOption,
    Sample,
} from '../../../../../generated/catalog_pb';
import { Resolver } from './resolver_interface';

export class DownloadableProductResolver implements Resolver {
    /**
     * Execute resolver for specified attribute
     *
     * "context" parameter can be used to pass extra data (as request schema e.t.c) for attribute resolver
     *
     * @param product
     * @param attribute
     */
    public resolveAttribute(product: Product, attribute: string): any[] {
        switch (attribute) {
            case 'downloadable_product_samples': {
                return this.resolveDownloadableProductSamples(product);
            }
            case 'downloadable_product_links': {
                return this.resolveDownloadableProductLinks(product);
            }
            default: {
                return [];
            }
        }
    }

    /**
     * Prepare data for downloadable product samples
     *
     * @param product
     */
    private resolveDownloadableProductSamples(product: Product) {
        const result = [];
        let downloadableSample = {} as Sample;
        for (downloadableSample of product.getSamplesList()) {
            let downloadableProductSample = {} as any;
            const downloadableSampleResource:
                | MediaResource
                | undefined = downloadableSample.getResource();
            downloadableProductSample.sort_order = downloadableSample.getSortOrder();
            if (downloadableSampleResource !== undefined) {
                downloadableProductSample.title = downloadableSampleResource.getLabel();
                downloadableProductSample.sample_url = downloadableSampleResource.getUrl();
            }
            result.push(downloadableProductSample);
        }

        return result;
    }

    /**
     * Prepare data for downloadable product links
     *
     * @param product
     */
    private resolveDownloadableProductLinks(product: Product) {
        const result = [];
        let productOption = {} as ProductOption;
        for (productOption of product.getProductOptionsList()) {
            if (productOption.getType() === 'downloadable') {
                let downloadableProductLinkInfo = {};
                for (let downloadableLink of productOption.getValuesList()) {
                    downloadableProductLinkInfo = {
                        uid: downloadableLink.getId(),
                        title: downloadableLink.getLabel(),
                        sort_order: downloadableLink.getSortOrder(),
                        price: downloadableLink.getPrice(),
                        sample_url: downloadableLink.getInfoUrl(),
                    };
                    result.push(downloadableProductLinkInfo);
                }
            }
        }
        return result;
    }
}
