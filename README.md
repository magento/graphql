# 📈 @magento/graphql

Decoupled GraphQL Server for Magento 2 stores.

## Setting up for Development

1. Clone the resository
2. Run `npm install`
3. Run `npm run build`
4. Run `npm run start`

## Development Watch Mode

We recommended using `npm run watch` in lieu of `npm run build` when making frequent changes locally.

#### Automated

-   Clean artifacts from previous local builds
-   Watch TypeScript and run the TypeScript compiler on change
-   Watch `typeDefs` in TypeScript files, and run code generation to generate corresponding TS types
-   Watch `protosets/app.protoset`, and run gRPC fixture code generation on change
