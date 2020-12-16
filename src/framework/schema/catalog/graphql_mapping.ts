/**
 * Prepare mapping for storefront fields which are differ from store front names
 * We need it to obtain needed data from storefront by keys which are used in storage
 */
export const graphQlMapping = new Map(
    [
        ['downloadable_product_samples', 'samples'],
        ['downloadable_product_links', 'product_options'],
    ]
);
