import { Product } from '../../../../generated/catalog_pb';

/**
 * Map of storefront attributes and their getters
 * TODO: need to merge somehow graphql/generated/catalog_pb.d.ts "Product {} class" attributes with "Product {}" type
 */
const attributeToFunction: any = {
    id: function(product: Product) {
        return product.getId();
    },
    attributeSetId: function(product: Product) {
        return product.getAttributeSetId();
    },
    hasOptions: function(product: Product) {
        return product.getHasOptions();
    },
    createdAt: function(product: Product) {
        return product.getCreatedAt();
    },
    updatedAt: function(product: Product) {
        return product.getUpdatedAt();
    },
    sku: function(product: Product) {
        return product.getSku();
    },
    typeId: function(product: Product) {
        return product.getTypeId();
    },
    status: function(product: Product) {
        return product.getStatus();
    },
    stockStatus: function(product: Product) {
        return product.getStockStatus();
    },
    name: function(product: Product) {
        return product.getName();
    },
    description: function(product: Product) {
        return product.getDescription();
    },
    shortDescription: function(product: Product) {
        return product.getShortDescription();
    },
    urlKey: function(product: Product) {
        return product.getUrlKey();
    },
    qty: function(product: Product) {
        return product.getQty();
    },
    taxClassId: function(product: Product) {
        return product.getTaxClassId();
    },
    weight: function(product: Product) {
        return product.getWeight();
    },
    imagesList: function(product: Product) {
        return product.getImagesList();
    },
    videosList: function(product: Product) {
        return product.getVideosList();
    },
    samplesList: function(product: Product) {
        return product.getSamplesList();
    },
    visibility: function(product: Product) {
        return product.getVisibility();
    },
    dynamicAttributesList: function(product: Product) {
        return product.getDynamicAttributesList();
    },
    metaDescription: function(product: Product) {
        return product.getMetaDescription();
    },
    metaKeyword: function(product: Product) {
        return product.getMetaKeyword();
    },
    metaTitle: function(product: Product) {
        return product.getMetaTitle();
    },
    categoriesList: function(product: Product) {
        return product.getCategoriesList();
    },
    requiredOptions: function(product: Product) {
        return product.getRequiredOptions();
    },
    createdIn: function(product: Product) {
        return product.getCreatedIn();
    },
    updatedIn: function(product: Product) {
        return product.getUpdatedIn();
    },
    quantityAndStockStatus: function(product: Product) {
        return product.getQuantityAndStockStatus();
    },
    optionsContainer: function(product: Product) {
        return product.getOptionsContainer();
    },
    msrpDisplayActualPriceType: function(product: Product) {
        return product.getMsrpDisplayActualPriceType();
    },
    isReturnable: function(product: Product) {
        return product.getIsReturnable();
    },
    urlSuffix: function(product: Product) {
        return product.getUrlSuffix();
    },
    optionsList: function(product: Product) {
        return product.getOptionsList();
    },
    urlRewritesList: function(product: Product) {
        return product.getUrlRewritesList();
    },
    countryOfManufacture: function(product: Product) {
        return product.getCountryOfManufacture();
    },
    giftMessageAvailable: function(product: Product) {
        return product.getGiftMessageAvailable();
    },
    specialPrice: function(product: Product) {
        return product.getSpecialPrice();
    },
    specialFromDate: function(product: Product) {
        return product.getSpecialFromDate();
    },
    specialToDate: function(product: Product) {
        return product.getSpecialToDate();
    },
    productLinksList: function(product: Product) {
        return product.getProductLinksList();
    },
    canonicalUrl: function(product: Product) {
        return product.getCanonicalUrl();
    },
    priceView: function(product: Product) {
        return product.getPriceView();
    },
    linksPurchasedSeparately: function(product: Product) {
        return product.getLinksPurchasedSeparately();
    },
    onlyXLeftInStock: function(product: Product) {
        return product.getOnlyXLeftInStock();
    },
    groupedItemsList: function(product: Product) {
        return product.getGroupedItemsList();
    },
    productOptionsList: function(product: Product) {
        return product.getProductOptionsList();
    },
    shopperInputOptionsList: function(product: Product) {
        return product.getShopperInputOptionsList();
    },
};

/**
 * Get store front attribute value by attribute code
 *
 * @param attribute
 * @param product
 */
export function getStorefrontAttributeValue(
    attribute: string,
    product: Product,
): string | [] | null {
    const getAttribute = attributeToFunction.hasOwnProperty(attribute)
        ? attribute
        : undefined;
    if (getAttribute !== undefined) {
        return attributeToFunction[getAttribute](product);
    }
    throw new Error(
        `Get attribute method for attribute "${attribute}" doesn't exist`,
    );
}
