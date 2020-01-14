# Magento GraphQL

Decoupled GraphQL Server for Magento 2 stores.

# Prerequisites

-   Must have the ECP fork of Magento 2 running
-   Must have [`roadrunner`](https://github.com/spiral/roadrunner) running alongside the ECP m2 fork
-   `roadrunner` currently needs to bind to `0.0.0.0:9001` (hardcoded, will change)

## Getting Started

1. Run `npm install` in the root of the project
2. Run `npm run build`
3. Run `npm start`

A URL should be flushed to stdout if the server has started successfully. Following this URL in a browser will load the GraphQL Playground.


## Docker installation
* Generate `magento.protoset` file in Magento using `./bin/magento proto:marshal` CLI command
* Copy `magento.protoset` file to `build/fdsets/app.protoset`. Currently only app service is supported.
* Launch `docker build -t graphql:latest .` in app root directory
* Launch local application using `docker run -p 4000:4000 --rm -it graphql:latest`