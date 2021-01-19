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
        The ID number assigned to the product.
        """
        id: Int

        """
        A number or code assigned to a product to identify the product, options, price, and manufacturer.
        """
        sku: String
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

        """
        The product's country of origin.
        """
        country_of_manufacture: String

        """
        Timestamp indicating when the product was created.
        """
        created_at: String

        """
        Indicates whether a gift message is available.
        """
        gift_message_available: String

        """
        The ID number assigned to the product.
        """
        id: Int

        """
        Indicates whether the product can be returned
        """
        is_returnable: String

        """
        A number representing the product's manufacturer.
        """
        manufacturer: Int

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
        A number or code assigned to a product to identify the product, options, price, and manufacturer.
        """
        sku: String
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

        """
        The product's country of origin.
        """
        country_of_manufacture: String

        """
        Timestamp indicating when the product was created.
        """
        created_at: String

        """
        Indicates whether a gift message is available.
        """
        gift_message_available: String

        """
        The ID number assigned to the product.
        """
        id: Int

        """
        Indicates whether the product can be returned
        """
        is_returnable: String

        """
        A number representing the product's manufacturer.
        """
        manufacturer: Int

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
        A number or code assigned to a product to identify the product, options, price, and manufacturer.
        """
        sku: String
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
