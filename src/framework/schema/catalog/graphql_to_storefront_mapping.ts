/**
 * Prepare mapping between original GraphQl scheme fields and storefront API fields
 *
 * Some storefront API field names are not consistent with GraphQl scheme. We need it to obtain needed data from
 * storefront by keys which are used in storage and transform them to values according to GraphQl scheme
 */
export const graphToStorefrontQlMapping = new Map([
    ['downloadable_product_samples', 'samples'],
    ['downloadable_product_links', 'product_options'],
]);
