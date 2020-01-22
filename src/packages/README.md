# Packages

A package is a combination of a few things required to extend the GraphQL API:

1. Type Definitions
2. Resolvers
3. Data Sources

## Creating a new Package

1. Add a new directory under `packages/`
2. Create an `index.ts` file with the template supplied below
3. Restart the server

## Package Index Template

```js
// packages/<your-package>/index.ts
import { IResolvers } from '../../../generated/graphql';
import { gql } from 'apollo-server';

export function setup() {
    const typeDefs = gql`GraphQL schema definition language (SDL) here`;
    const resolvers: IResolvers = {
        // Resolvers for your typeDefs here
    };
    const dataSources = () => ({
        someAPI: new SomeAPIDataSource(),
    });

    return { typeDefs, resolvers, dataSources };
}
```
