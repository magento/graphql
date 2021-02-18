/**
 * Resolve product type by type_id value (retrieved from Storefront API)
 *
 * @param type
 */
export function resolveType(type: 'simple' | 'downloadable') {
    if (type === 'simple') {
        return 'SimpleProduct';
    }

    if (type === 'downloadable') {
        return 'DownloadableProduct';
    }
    return 'SimpleProduct';
}
