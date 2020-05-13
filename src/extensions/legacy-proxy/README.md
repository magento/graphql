# @magento/magento-graphql-legacy-proxy

Proxies requests back to the PHP GraphQL server for any fields/types not yet implemented in `@magento/graphql` core.

## Magento Headers and Authentication

When requests fall back to PHP GraphQL, necessary headers will automatically be proxied to the Magento store (`Authorization`, `Store`, and `Content-Currency`).
