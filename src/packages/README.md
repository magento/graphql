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
import { GraphQLContext } from '../../types';
import { gql } from 'apollo-server';

export function setup() {
    const typeDefs = gql`
        type MyNewInput = {
            name: value
        }

        type NewQueryReply {
            value: String
        }

        extend type Query {
            newQuery(input: MyNewInput): NewQueryReply
        }
    `;

    type Context = GraphQLContext<{ someAPI: SomeAPIDataSource }>;
    const resolvers: IResolvers<Context> = {
        Query: {
            newQuery(parent, args, context) {
                // dataSources availalble on context.dataSources
                const { name } = args.input;
                return { value: name };
            },
        },
    };
    const dataSources = () => ({
        someAPI: new SomeAPIDataSource(),
    });

    return { typeDefs, resolvers, dataSources };
}
```

## Working Example

See [`src/packages/echo/`](/src/packages/echo/) for an example of a package that also includes a remote data source.

## Caveats

GraphQL packages do not have any enforced ordering right now, meaning packages have to be written in a way where they don't assume what order they've been merged into the overall schema with.

The ordering is dependent on the results of a readdir system call, which is platform-specific. In the future we can discuss introducing some form of dependency declaration/resolution so we have constraints to build an ordering from.
