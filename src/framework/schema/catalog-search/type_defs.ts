/**
 * TODO: (SFAPP-273) TEMPORARY solution to test requests to gRPC from test GraphQL query (should be fixed in SFAPP-227)
 */
import gql from 'graphql-tag';

export const typeDefs = gql`
    """
    ProductAttributeFilterInput defines the filters to be used in the search. A
    filter contains at least one attribute, a comparison operator, and the value
    that is being searched for.
    """
    input ProductAttributeFilterInput {
        """
        Filter product by category id
        """
        category_id: FilterEqualTypeInput

        """
        Attribute label: Description
        """
        description: FilterMatchTypeInput

        """
        Attribute label: Product Name
        """
        name: FilterMatchTypeInput

        """
        Attribute label: Price
        """
        price: FilterRangeTypeInput

        """
        Attribute label: Short Description
        """
        short_description: FilterMatchTypeInput

        """
        Attribute label: SKU
        """
        sku: FilterEqualTypeInput

        """
        The part of the URL that identifies the product
        """
        url_key: FilterEqualTypeInput
    }

    """
    Defines a filter that matches the input exactly.
    """
    input FilterEqualTypeInput {
        """
        A string to filter on
        """
        eq: String

        """
        An array of values to filter on
        """
        in: [String]
    }

    """
    Defines a filter that performs a fuzzy search.
    """
    input FilterMatchTypeInput {
        """
        One or more words to filter on
        """
        match: String
    }

    """
    Defines a filter that matches a range of values, such as prices or dates.
    """
    input FilterRangeTypeInput {
        """
        The beginning of the range
        """
        from: String

        """
        The end of the range
        """
        to: String
    }

    """
    ProductAttributeSortInput specifies the attribute to use for sorting search
    results and indicates whether the results are sorted in ascending or descending
    order. It's possible to sort products using searchable attributes with enabled
    'Use in Filter Options' option
    """
    input ProductAttributeSortInput {
        """
        Attribute label: Product Name
        """
        name: SortEnum

        """
        Sort by the position assigned to each product.
        """
        position: SortEnum

        """
        Attribute label: Price
        """
        price: SortEnum

        """
        Sort by the search relevance score (default).
        """
        relevance: SortEnum
    }

    """
    This enumeration indicates whether to return results in ascending or descending order
    """
    enum SortEnum {
        ASC
        DESC
    }

    """
    The ProductInterface contains attributes that are common to all types of
    products. Note that descriptions may not be available for custom and EAV attributes.
    """
    interface ProductInterface {
        """
        The ID number assigned to the product.
        """
        id: Int
    }

    """
    A simple product is tangible and are usually sold as single units or in fixed quantities.
    """
    type SimpleProduct implements ProductInterface {
        """
        The ID number assigned to the product.
        """
        id: Int
    }

    """
    DownloadableProduct defines a product that the customer downloads
    """
    type DownloadableProduct implements ProductInterface {
        """
        The ID number assigned to the product.
        """
        id: Int
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
        """
        The products query searches for products that match the criteria specified in the search and filter attributes.
        TODO: In our case "products" should retyrn only products ids, and then delegate call to catalog's "getProductsByIds" by merging or thomething like that
        """
        products(
            """
            Performs a full-text search using the specified key words.
            """
            search: String

            """
            Identifies which product attributes to search for and return.
            """
            filter: ProductAttributeFilterInput

            """
            Specifies the maximum number of results to return at once. This attribute is optional.
            """
            pageSize: Int = 20

            """
            Specifies which page of results to return. The default value is 1.
            """
            currentPage: Int = 1

            """
            Specifies which attributes to sort on, and whether to return the results in ascending or descending order.
            """
            sort: ProductAttributeSortInput
        ): Products
    }
`;
