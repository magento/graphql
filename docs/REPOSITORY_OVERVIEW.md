# Repository Overview

The `@magento/graphql` package includes:

-   A CLI app that runs the GraphQL server via HTTP
-   A programmatic API to run the GraphQL server
-   APIs for developers to extend the graph

## 🚌 Repository Tour

### `src`

-   [`src/api.ts`](../src/api.ts): Entry point for programmatic usage. Exposes APIs for extension developers, and some other advanced use-cases

-   [`src/cli.ts`](../src/cli.ts): Implementation of CLI app

-   [`src/framework`](../src/framework): Framework code, primarily used to run and coordinate work between extensions and abstract away handling of configuration

-   [`src/extensions`](../src/extensions): Official Magento extensions. Structured like a monorepo, but packages are not published independently to simplify versioning

-   [`src/server.ts`](../src/server.ts): Takes the GraphQL schema created via running all extensions, and exposes it over HTTP using [`Fastify`](https://www.fastify.io/)

### `scripts`

-   [`scripts/dev.js`](../scripts/dev.js): Incremental builds during local development. See [`DEVELOPMENT.md`](DEVELOPMENT.md)

-   [`scripts/protogen.js`](../scripts/protogen.js): Executed automatically during the build process. Integrates with the [Protocol Buffers](https://developers.google.com/protocol-buffers) compiler

-   [`scripts/update-legacy-schema.js`](../scripts/update-legacy-schema.js): Fetches and serializes a copy of the GraphQL schema from a Magento 2 store, and writes it to disk. See the [`legacy-proxy`](../src/extensions/legacy-proxy/README.md) extension for more info

### `bin`

-   [`bin/magento-graphql`](../bin/magento-graphql): Minimal entry point for the CLI app. Thin shell wrapper around the execution of `src/cli.ts`.
