# Magento GraphQL

Decoupled GraphQL Server for Magento 2 stores.

# Prerequisites

-   Must have the ECP fork of Magento 2 running
-   Must have [`roadrunner`](https://github.com/spiral/roadrunner) running alongside the ECP m2 fork

## Getting Started

1. Run `npm install` in the root of the project
2. Run `npm run build`
3. Run `npm start`

A URL should be flushed to stdout if the server has started successfully. Following this URL in a browser will load the GraphQL Playground.

## Configuring the Host/Port of the gRPC Echo Service

The following environment variables can be set

-   `ECHO_HOST` (default `0.0.0.0`)
-   `ECHO_PORT` (default: `9001`)

## Docker installation

-   Generate `magento.protoset` file in Magento using `./bin/magento proto:marshal` CLI command
-   Copy `magento.protoset` file to `protosets/app.protoset`. Currently only the echo service is supported.
-   Launch `docker build -t graphql:latest .` in app root directory
-   Launch local application using `docker run -p 4000:4000 --rm -e ECHO_HOST=grpc_host -e ECHO_PORT=9001
