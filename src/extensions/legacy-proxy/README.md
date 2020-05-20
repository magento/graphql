# @magento/magento-graphql-legacy-proxy

Proxies requests back to the PHP GraphQL server for any fields/types not yet implemented in `@magento/graphql` core.

## Why?

Magento already has an implementation of GraphQL within the PHP application. The goal of this application is to decouple from the monolith, but this will take a significant period of time.

Proxying requests back to the PHP implementation removes the need for complete API coverage in this server prior to a release. This will enable us to migrate pieces of the schema piece-by-piece, avoiding breaking changes.

The idea is that, once you're using `@magento/graphql`, your front-end should not need to know which GraphQL server is resolving the query behind the scenes.

## Schema Syncing

To enable other extensions in `@magento/graphql` to extend types that are still implemented in PHP (example: `B2B` extending `Customer`), this package checks in a `.graphql` file with a definition of the merged schema from Magento core. When developing locally, this can be synced using the `scripts/update-legacy-schema.js` utility.

When the server first starts up, it compares the schema against the remote PHP server to ensure they're compatible.

## Magento Headers and Authentication

When requests fall back to PHP GraphQL, necessary headers will automatically be proxied to the Magento store (`Authorization`, `Store`, and `Content-Currency`).
