# Repository Overview

The `@magento/graphql` package includes:

-   A CLI app that runs the GraphQL server via HTTP
-   A programmatic API to run the GraphQL server
-   APIs for Adobe/Magento employees to extend the Graph

## 🚌 Repository Tour

### `src`

-   [`src/api.ts`](../src/api.ts): Entry point for programmatic usage

-   [`src/cli.ts`](../src/cli.ts): Implementation of CLI app

-   [`src/framework`](../src/framework): Magento GraphQL framework (used by CLI and Programmatic API)

-   [`src/schema`](../src/schema): Official Magento GraphQL schema definitions/implementations.

-   [`src/server.ts`](../src/server.ts): Takes the GraphQL schema created via running all extensions, and exposes it over HTTP using [`Fastify`](https://www.fastify.io/)

### `scripts`

-   [`scripts/dev.js`](../scripts/dev.js): Incremental builds during local development. See [`DEVELOPMENT.md`](DEVELOPMENT.md)

-   [`scripts/protogen.js`](../scripts/protogen.js): Executed automatically during the build process. Integrates with the [Protocol Buffers](https://developers.google.com/protocol-buffers) compiler. Used for gRPC integration

-   [`scripts/update-monolith-schema.js`](../scripts/update-monolith-schema.js): Fetches and serializes a copy of the GraphQL schema from a Magento 2 store, and writes it to disk. See the [`monolith-proxy`](../src/framework/schema/monolith-proxy) schema for more info

### `bin`

-   [`bin/magento-graphql`](../bin/magento-graphql): Minimal entry point for the CLI app. Thin shell wrapper around the execution of `src/cli.ts`.
