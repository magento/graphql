/**
 * Resolve entity type by type_id value (obtained from storefront)
 *
 * @param type
 */
export function resolveType(type: 'simple' | 'downloadable') {
    if (type === 'simple') {
        return 'NewProductType';
    }

    if (type === 'downloadable') {
        return 'NewDownloadableProductType';
    }
    return 'NewProductType';
}
