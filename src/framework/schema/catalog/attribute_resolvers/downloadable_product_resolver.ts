/**
 * Resolver for downloadable product attributes
 */
import {
    MediaResource,
    Product,
    ProductOption,
    Sample,
} from '../../../../../generated/catalog_pb';

/**
 * Execute resolver for specified attribute
 *
 * @param product
 * @param attribute
 */
export function resolveDownloadableAttribute(
    product: Product,
    attribute: string,
) {
    switch (attribute) {
        case 'downloadable_product_samples': {
            return resolveDownloadableProductSamples(product);
        }
        case 'downloadable_product_links': {
            return resolveDownloadableProductLinks(product);
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
function resolveDownloadableProductSamples(product: Product) {
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
function resolveDownloadableProductLinks(product: Product): {}[] {
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
