/**
 * Resolver for downloadable product attributes
 */
import {MediaResource, Product, ProductOption, Sample} from "../../../../../generated/catalog_pb";
import {resolvedAttributes, storefrontAttributesMapping} from '../attribute_resolver'

/**
 * Fill attribute resolvers handler by downloadable product resolver
 */
export async function fillDownloadableProductResolver() {
    let attributeCodes = ['downloadable_product_samples', 'downloadable_product_links'];
    for (let attributeCode of attributeCodes) {
        storefrontAttributesMapping.push(attributeCode);
        if (!resolvedAttributes.find(i => i.attribute === attributeCode)) {
            switch(attributeCode) {
                case 'downloadable_product_samples': {
                    resolvedAttributes.push({attribute:attributeCode, function:resolveDownloadableProductSamples});
                    break;
                }
                case 'downloadable_product_links': {
                    resolvedAttributes.push({attribute:attributeCode, function:resolveDownloadableProductLinks});
                    break;
                }
                default: {
                    break;
                }
            }
        }
    }
}

/**
 * Prepare data for downloadable product samples
 *
 * @param product
 */
async function resolveDownloadableProductSamples(product: Product) {
    const result = [];
    let downloadableSample = {} as Sample;
    for (downloadableSample of product.getSamplesList()) {
        let downloadableProductSample = {} as any;
        const downloadableSampleResource: MediaResource|undefined = downloadableSample.getResource();
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
async function resolveDownloadableProductLinks(product: Product) {
    const result = [];
    let productOption = {} as ProductOption;
    for (productOption of product.getProductOptionsList()) {
        if (productOption.getType() === 'downloadable') {
            let downloadableProductLinkInfo = {};
            for (let downloadableLink of productOption.getValuesList()) {
                downloadableProductLinkInfo = {
                    "uid": downloadableLink.getId(),
                    "title": downloadableLink.getLabel(),
                    "sort_order": downloadableLink.getSortOrder(),
                    "price": downloadableLink.getPrice(),
                    "sample_url": downloadableLink.getInfoUrl(),
                }
                result.push(downloadableProductLinkInfo);
            }
        }
    }
    return result;
}
