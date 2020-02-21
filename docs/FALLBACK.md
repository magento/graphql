# Fallback

The long-term vision for this application is to be the single official implementation of GraphQL within Magento.

However, we still have the PHP implementation built with [`graphql-php`](https://github.com/webonyx/graphql-php) in Magento core, and we are avoiding a big bang re-write + release.

Instead, schema ownership and resolvers will slowly be migrated to this application as more data is exposed from faster APIs in Magento core. We will look into sunsetting the PHP GraphQL implementation once we've reached parity with the schema and have removed the fallback.

## Extensions

At this time, extensions to this GraphQL application are only intended to extend the schema defined by this application. In other words, once the Catalog schema + resolvers are migrated to this application, we'll support extensions. Until then, extensions to the Magento Core schema should continue to be written in PHP as Magento modules.

## Magento Headers and Authentication

When requests fall back to PHP GraphQL, necessary headers will automatically be proxied to the Magento store (`Authorization`, `Store`, and `Content-Currency`).
