/**
 * Prepare type definitions for catalog service
 *
 * TODO: (SFAPP-272) TEMPORARY solution to test requests to gRPC from test GraphQL query (should be fixed in SFAPP-227).
 * TODO: Need to find a way to "extend" original schema instead of duplicating existing.
 */
import gql from 'graphql-tag';

export const typeDefs = gql`
    """
    The ProductInterface contains attributes that are common to all types of
    products. Note that descriptions may not be available for custom and EAV attributes.
    """
    interface ProductInterface {
        """
        The attribute set assigned to the product.
        """
        attribute_set_id: Int

        """
        Relative canonical URL. This value is returned only if the system setting 'Use
        Canonical Link Meta Tag For Products' is enabled
        """
        canonical_url: String

        color: Int

        """
        The product's country of origin.
        """
        country_of_manufacture: String

        """
        Timestamp indicating when the product was created.
        """
        created_at: String

        """
        Crosssell Products
        """
        crosssell_products: [ProductInterface]

        """
        Detailed information about the product. The value can include simple HTML tags.
        """
        description: ComplexTextValue

        """
        Indicates whether a gift message is available.
        """
        gift_message_available: String

        """
        The ID number assigned to the product.
        """
        id: Int

        """
        The relative path to the main image on the product page.
        """
        image: ProductImage

        """
        A number representing the product's manufacturer.
        """
        manufacturer: Int

        """
        An array of Media Gallery objects.
        """
        media_gallery: [MediaGalleryInterface]

        """
        A brief overview of the product for search results listings, maximum 255 characters.
        """
        meta_description: String

        """
        A comma-separated list of keywords that are visible only to search engines.
        """
        meta_keyword: String

        """
        A string that is displayed in the title bar and tab of the browser and in search results lists.
        """
        meta_title: String

        """
        The product name. Customers use this name to identify the product.
        """
        name: String

        """
        Product stock only x left count
        """
        only_x_left_in_stock: Float

        """
        If the product has multiple options, determines where they appear on the product page.
        """
        options_container: String

        """
        An array of ProductLinks objects.
        """
        product_links: [ProductLinksInterface]

        """
        Related Products
        """
        related_products: [ProductInterface]

        """
        A short description of the product. Its use depends on the theme.
        """
        short_description: ComplexTextValue

        """
        A number or code assigned to a product to identify the product, options, price, and manufacturer.
        """
        sku: String

        """
        The relative path to the small image, which is used on catalog pages.
        """
        small_image: ProductImage

        """
        The beginning date that a product has a special price.
        """
        special_from_date: String

        """
        The discounted price of the product.
        """
        special_price: Float

        """
        The end date that a product has a special price.
        """
        special_to_date: String

        """
        The file name of a swatch image
        """
        swatch_image: String

        """
        The relative path to the product's thumbnail image.
        """
        thumbnail: ProductImage

        """
        Timestamp indicating when the product was updated.
        """
        updated_at: String

        """
        Upsell Products
        """
        upsell_products: [ProductInterface]

        """
        The part of the URL that identifies the product
        """
        url_key: String

        """
        URL rewrites list
        """
        url_rewrites: [UrlRewrite]

        """
        The part of the product URL that is appended after the url key
        """
        url_suffix: String
    }

    """
    ProductLinks is an implementation of ProductLinksInterface.
    """
    type ProductLinks implements ProductLinksInterface {
        """
        One of related, associated, upsell, or crosssell.
        """
        link_type: String

        """
        The SKU of the linked product.
        """
        linked_product_sku: String

        """
        The type of linked product (simple, virtual, bundle, downloadable, grouped, configurable).
        """
        linked_product_type: String

        """
        The position within the list of product links.
        """
        position: Int

        """
        The identifier of the linked product.
        """
        sku: String
    }

    """
    ProductLinks contains information about linked products, including the link type and product type of each item.
    """
    interface ProductLinksInterface {
        """
        One of related, associated, upsell, or crosssell.
        """
        link_type: String

        """
        The SKU of the linked product.
        """
        linked_product_sku: String

        """
        The type of linked product (simple, virtual, bundle, downloadable, grouped, configurable).
        """
        linked_product_type: String

        """
        The position within the list of product links.
        """
        position: Int

        """
        The identifier of the linked product.
        """
        sku: String
    }

    type ComplexTextValue {
        """
        HTML format
        """
        html: String!
    }

    """
    The object contains URL rewrite details
    """
    type UrlRewrite {
        """
        Request parameters
        """
        parameters: [HttpQueryParameter]

        """
        Request URL
        """
        url: String
    }

    """
    The object details of target path parameters
    """
    type HttpQueryParameter {
        """
        Parameter name
        """
        name: String

        """
        Parameter value
        """
        value: String
    }

    """
    Product image information. Contains the image URL and label.
    """
    type ProductImage implements MediaGalleryInterface {
        """
        Whether the image is hidden from view.
        """
        disabled: Boolean

        """
        The label of the product image or video.
        """
        label: String

        """
        The media item's position after it has been sorted.
        """
        position: Int

        """
        The URL of the product image or video.
        """
        url: String
    }

    """
    Contains basic information about a product image or video.
    """
    interface MediaGalleryInterface {
        """
        Whether the image is hidden from view.
        """
        disabled: Boolean

        """
        The label of the product image or video.
        """
        label: String

        """
        The media item's position after it has been sorted.
        """
        position: Int

        """
        The URL of the product image or video.
        """
        url: String
    }

    """
    A simple product is tangible and are usually sold as single units or in fixed quantities.
    """
    type SimpleProduct implements ProductInterface {
        """
        The attribute set assigned to the product.
        """
        attribute_set_id: Int

        """
        Relative canonical URL. This value is returned only if the system setting 'Use
        Canonical Link Meta Tag For Products' is enabled
        """
        canonical_url: String

        color: Int

        """
        The product's country of origin.
        """
        country_of_manufacture: String

        """
        Timestamp indicating when the product was created.
        """
        created_at: String

        """
        Crosssell Products
        """
        crosssell_products: [ProductInterface]

        """
        Detailed information about the product. The value can include simple HTML tags.
        """
        description: ComplexTextValue

        """
        Indicates whether a gift message is available.
        """
        gift_message_available: String

        """
        The ID number assigned to the product.
        """
        id: Int

        """
        The relative path to the main image on the product page.
        """
        image: ProductImage

        """
        A number representing the product's manufacturer.
        """
        manufacturer: Int

        """
        An array of Media Gallery objects.
        """
        media_gallery: [MediaGalleryInterface]

        """
        A brief overview of the product for search results listings, maximum 255 characters.
        """
        meta_description: String

        """
        A comma-separated list of keywords that are visible only to search engines.
        """
        meta_keyword: String

        """
        A string that is displayed in the title bar and tab of the browser and in search results lists.
        """
        meta_title: String

        """
        The product name. Customers use this name to identify the product.
        """
        name: String

        """
        Product stock only x left count
        """
        only_x_left_in_stock: Float

        """
        If the product has multiple options, determines where they appear on the product page.
        """
        options_container: String

        """
        An array of ProductLinks objects.
        """
        product_links: [ProductLinksInterface]

        """
        Related Products
        """
        related_products: [ProductInterface]

        """
        A short description of the product. Its use depends on the theme.
        """
        short_description: ComplexTextValue

        """
        A number or code assigned to a product to identify the product, options, price, and manufacturer.
        """
        sku: String

        """
        The relative path to the small image, which is used on catalog pages.
        """
        small_image: ProductImage

        """
        The beginning date that a product has a special price.
        """
        special_from_date: String

        """
        The discounted price of the product.
        """
        special_price: Float

        """
        The end date that a product has a special price.
        """
        special_to_date: String

        """
        The file name of a swatch image
        """
        swatch_image: String

        """
        The relative path to the product's thumbnail image.
        """
        thumbnail: ProductImage

        """
        Timestamp indicating when the product was updated.
        """
        updated_at: String

        """
        Upsell Products
        """
        upsell_products: [ProductInterface]

        """
        The part of the URL that identifies the product
        """
        url_key: String

        """
        URL rewrites list
        """
        url_rewrites: [UrlRewrite]

        """
        The part of the product URL that is appended after the url key
        """
        url_suffix: String
    }

    """
    DownloadableProduct defines a product that the customer downloads
    """
    type DownloadableProduct implements ProductInterface {
        """
        An array containing information about the links for this downloadable product
        """
        downloadable_product_links: [DownloadableProductLinks]

        """
        An array containing information about samples of this downloadable product.
        """
        downloadable_product_samples: [DownloadableProductSamples]

        """
        The attribute set assigned to the product.
        """
        attribute_set_id: Int

        """
        Relative canonical URL. This value is returned only if the system setting 'Use
        Canonical Link Meta Tag For Products' is enabled
        """
        canonical_url: String

        color: Int

        """
        The product's country of origin.
        """
        country_of_manufacture: String

        """
        Timestamp indicating when the product was created.
        """
        created_at: String

        """
        Crosssell Products
        """
        crosssell_products: [ProductInterface]

        """
        Detailed information about the product. The value can include simple HTML tags.
        """
        description: ComplexTextValue

        """
        Indicates whether a gift message is available.
        """
        gift_message_available: String

        """
        The ID number assigned to the product.
        """
        id: Int

        """
        The relative path to the main image on the product page.
        """
        image: ProductImage

        """
        A number representing the product's manufacturer.
        """
        manufacturer: Int

        """
        An array of Media Gallery objects.
        """
        media_gallery: [MediaGalleryInterface]

        """
        A brief overview of the product for search results listings, maximum 255 characters.
        """
        meta_description: String

        """
        A comma-separated list of keywords that are visible only to search engines.
        """
        meta_keyword: String

        """
        A string that is displayed in the title bar and tab of the browser and in search results lists.
        """
        meta_title: String

        """
        The product name. Customers use this name to identify the product.
        """
        name: String

        """
        Product stock only x left count
        """
        only_x_left_in_stock: Float

        """
        If the product has multiple options, determines where they appear on the product page.
        """
        options_container: String

        """
        An array of ProductLinks objects.
        """
        product_links: [ProductLinksInterface]

        """
        Related Products
        """
        related_products: [ProductInterface]

        """
        A short description of the product. Its use depends on the theme.
        """
        short_description: ComplexTextValue

        """
        A number or code assigned to a product to identify the product, options, price, and manufacturer.
        """
        sku: String

        """
        The relative path to the small image, which is used on catalog pages.
        """
        small_image: ProductImage

        """
        The beginning date that a product has a special price.
        """
        special_from_date: String

        """
        The discounted price of the product.
        """
        special_price: Float

        """
        The end date that a product has a special price.
        """
        special_to_date: String

        """
        The file name of a swatch image
        """
        swatch_image: String

        """
        The relative path to the product's thumbnail image.
        """
        thumbnail: ProductImage

        """
        Timestamp indicating when the product was updated.
        """
        updated_at: String

        """
        Upsell Products
        """
        upsell_products: [ProductInterface]

        """
        The part of the URL that identifies the product
        """
        url_key: String

        """
        URL rewrites list
        """
        url_rewrites: [UrlRewrite]

        """
        The part of the product URL that is appended after the url key
        """
        url_suffix: String
    }

    """
    DownloadableProductLinks defines characteristics of a downloadable product
    """
    type DownloadableProductLinks {
        """
        The price of the downloadable product
        """
        price: Float

        """
        URL to the downloadable sample
        """
        sample_url: String

        """
        A number indicating the sort order
        """
        sort_order: Int

        """
        The display name of the link
        """
        title: String

        """
        A string that encodes option details.
        """
        uid: ID!
    }

    """
    DownloadableProductSamples defines characteristics of a downloadable product
    """
    type DownloadableProductSamples {
        """
        URL to the downloadable sample
        """
        sample_url: String

        """
        A number indicating the sort order
        """
        sort_order: Int

        """
        The display name of the sample
        """
        title: String
    }

    """
    The Products object is the top-level object returned in a product search.
    """
    type Products {
        """
        An array of products that match the specified search criteria.
        """
        items: [ProductInterface]
    }

    type Query {
        getProductsByIds(ids: [String]!): Products
    }
`;
