# Magento GraphQL

Decoupled GraphQL Server for Magento 2 stores.

## Prerequisites

-   Must have a store based on the [ECP fork of Magento 2](https://github.com/magento-architects/magento2ce), with a branch that includes gRPC functionality (example: `grpc2`)
-   Must have [`roadrunner`](https://github.com/spiral/roadrunner) running alongside the ECP m2 fork. A sample config will be in the root dir of the Magento store (`.rr.yaml`)

## Running Locally

### Get Protobufs from Magento

1. Run `bin/magento proto:marshal` in the Magento store. This will generate `magento.protoset` in the root of the store
2. Copy `magento.protoset` to `protosets/app.protoset` in this project

### Docker Setup

1. Run `docker build -t graphql:latest .` to build + tag an up-to-date image for the project
2. Start the server:
    ```sh
    docker run -p 4000:4000 --rm \
        # see config options further below
        -e ECHO_HOST=host.docker.internal \
        graphql:latest
    ```

### Local Setup

1. Install a version of `node.js` >= `12.0.0`
2. Run `npm install` in the root of the project
3. Run `npm run build` to generate types/fixtures and compile TypeScript sources
4. Run `npm run start` to start the server

### Incremental Builds

If you're working locally, `npm run watch` will take care of the following tasks:

-   Clean artifacts from previous local builds
-   Watch TypeScript and run the TypeScript compiler on change
-   Watch `typeDefs` in TypeScript files, and run code generation to generate corresponding TS types
-   Watch `protosets/app.protoset`, and run gRPC fixture code generation on change

It's recommended to use `npm run watch` in lieu of `npm run build` when making frequent changes locally.

## Documentation

-   [Configuration Options (set via ENV vars)](src/env/variables.json)
-   [In-Process Extensions](src/packages/README.md)
-   [Out-Of-Process Extensions](docs/OUT-OF-PROCESS-EXTENSIBILITY.md)
