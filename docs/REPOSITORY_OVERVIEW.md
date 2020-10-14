# Repository Overview

The `@magento/graphql` package includes:

-   A CLI app that runs the GraphQL server via HTTP
-   A lower-level programmatic API to run the GraphQL server
-   APIs for Adobe/Magento employees to extend the Graph (3rd party extensibility in the future)

## 🚌 Repository Tour

### `src`

-   [`src/index.ts`](../src/index.ts): Entry point for programmatic usage

-   [`src/cli/index.ts`](../src/cli/index.ts): Implementation of CLI app

-   [`src/framework`](../src/framework): Magento GraphQL framework (used by CLI and Programmatic API)

-   [`src/framework/schema`](../src/framework/schema): Official Magento GraphQL schema definitions/implementations.

-   [`src/server`](../src/server): Bindings for various node.js HTTP servers (currently `express` and `fastify`)

### `scripts`

-   [`scripts/dev.js`](../scripts/dev.js): Incremental builds during local development. See [`DEVELOPMENT.md`](DEVELOPMENT.md)

-   [`scripts/protogen.js`](../scripts/protogen.js): Executed automatically during the build process. Integrates with the [Protocol Buffers](https://developers.google.com/protocol-buffers) compiler. Used for gRPC integration

-   [`scripts/update-monolith-schema.js`](../scripts/update-monolith-schema.js): Fetches and serializes a copy of the GraphQL schema from a Magento 2 store, and writes it to disk. See the [`monolith-proxy`](../src/framework/schema/monolith-proxy) schema for more info

### `bin`

-   [`bin/magento-graphql`](../bin/magento-graphql): Minimal entry point for the CLI app. Thin shell wrapper around the execution of `src/cli`.
