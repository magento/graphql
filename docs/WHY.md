# 🤔 Why?

Magento 2 [already has GraphQL support](https://devdocs.magento.com/guides/v2.3/graphql/) in the PHP application. There are some parts of this implementation that are not ideal:

-   **Performance**: The structure of a GraphQL query lends itself well to resolving data in parallel. PHPs synchronous execution model makes it difficult to perform these types of optimizations, leading to serial execution

-   **Interop**: There are relatively few libraries for working with GraphQL in the PHP ecosystem, especially when compared to the number of tools available in the JavaScript ecosystem.

-   **Subscriptions**: The framework used for GraphQL in the PHP application has no plans to support subscriptions, which may be desirable in the future.
