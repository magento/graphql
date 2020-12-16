/**
 * TEMPORARY solution to test requests to gRPC from test GraphQL query
 */
import gql from 'graphql-tag';

export const typeDefs = gql`
    extend type Query {
        getProductsByIds(ids: [ID]!): NewProducts
    }

    type CatalogServiceProduct {
        id: ID!
        name: String!
    }

    type NewProducts {
        items: [NewProductInterface]
    }

    interface NewProductInterface {
        id: Int
        attribute_set_id: Int
        canonical_url: String
        categories: [CategoryInterface]
        color: Int
        country_of_manufacture: String
        created_at: String
        crosssell_products: [NewProductInterface]
        description: ComplexTextValue
        gift_message_available: String
        image: ProductImage
        is_returnable: String
        manufacturer: Int
        media_gallery: [MediaGalleryInterface]
        media_gallery_entries: [MediaGalleryEntry]
        meta_description: String
        meta_keyword: String
        meta_title: String
        name: String
        new_from_date: String
        new_to_date: String
        only_x_left_in_stock: Float
        options_container: String
        price: ProductPrices
        price_range: PriceRange!
        price_tiers: [TierPrice]
        product_links: [ProductLinksInterface]
        rating_summary: Float!
        related_products: [NewProductInterface]
        review_count: Int!
        reviews(
            pageSize: Int = 20
            currentPage: Int = 1
        ): ProductReviews!

        short_description: ComplexTextValue
        sku: String
        small_image: ProductImage
        special_from_date: String
        special_price: Float
        special_to_date: String
        stock_status: ProductStockStatus
        swatch_image: String
        thumbnail: ProductImage
        tier_price: Float
        tier_prices: [ProductTierPrices]
        type_id: String
        updated_at: String
        upsell_products: [NewProductInterface]
        url_key: String
        url_path: String
        url_rewrites: [UrlRewrite]
        url_suffix: String
        websites: [Website]
    }

    type NewProductType implements NewProductInterface {
        id: Int
        attribute_set_id: Int
        canonical_url: String
        categories: [CategoryInterface]
        color: Int
        country_of_manufacture: String
        created_at: String
        crosssell_products: [NewProductInterface]
        description: ComplexTextValue
        gift_message_available: String
        image: ProductImage
        is_returnable: String
        manufacturer: Int
        media_gallery: [MediaGalleryInterface]
        media_gallery_entries: [MediaGalleryEntry]
        meta_description: String
        meta_keyword: String
        meta_title: String
        name: String
        new_from_date: String
        new_to_date: String
        only_x_left_in_stock: Float
        options_container: String
        price: ProductPrices
        price_range: PriceRange!
        price_tiers: [TierPrice]
        product_links: [ProductLinksInterface]
        rating_summary: Float!
        related_products: [NewProductInterface]
        review_count: Int!
        reviews(
            pageSize: Int = 20
            currentPage: Int = 1
        ): ProductReviews!

        short_description: ComplexTextValue
        sku: String
        small_image: ProductImage
        special_from_date: String
        special_price: Float
        special_to_date: String
        stock_status: ProductStockStatus
        swatch_image: String
        thumbnail: ProductImage
        tier_price: Float
        tier_prices: [ProductTierPrices]
        type_id: String
        updated_at: String
        upsell_products: [NewProductInterface]
        url_key: String
        url_path: String
        url_rewrites: [UrlRewrite]
        url_suffix: String
        websites: [Website]
    }

    type NewDownloadableProductType implements NewProductInterface {
        id: Int
        attribute_set_id: Int
        canonical_url: String
        categories: [CategoryInterface]
        color: Int
        country_of_manufacture: String
        created_at: String
        crosssell_products: [NewProductInterface]
        description: ComplexTextValue
        gift_message_available: String
        image: ProductImage
        is_returnable: String
        manufacturer: Int
        media_gallery: [MediaGalleryInterface]
        media_gallery_entries: [MediaGalleryEntry]
        meta_description: String
        meta_keyword: String
        meta_title: String
        name: String
        new_from_date: String
        new_to_date: String
        only_x_left_in_stock: Float
        options_container: String
        price: ProductPrices
        price_range: PriceRange!
        price_tiers: [TierPrice]
        product_links: [ProductLinksInterface]
        rating_summary: Float!
        related_products: [NewProductInterface]
        review_count: Int!
        reviews(
            pageSize: Int = 20
            currentPage: Int = 1
        ): ProductReviews!

        short_description: ComplexTextValue
        sku: String
        small_image: ProductImage
        special_from_date: String
        special_price: Float
        special_to_date: String
        stock_status: ProductStockStatus
        swatch_image: String
        thumbnail: ProductImage
        tier_price: Float
        tier_prices: [ProductTierPrices]
        type_id: String
        updated_at: String
        upsell_products: [NewProductInterface]
        url_key: String
        url_path: String
        url_rewrites: [UrlRewrite]
        url_suffix: String
        websites: [Website]
        """
        An array containing information about the links for this downloadable product
        """
        downloadable_product_links: [DownloadableProductLinks]

        """
        An array containing information about samples of this downloadable product.
        """
        downloadable_product_samples: [DownloadableProductSamples]
    }
`;
