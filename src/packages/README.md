# Packages

A package is a combination of 2 things required to extend the GraphQL API:

1. Type Definitions
2. Resolvers

## Creating a new Package

1. Add a new directory under `packages/`
2. Create an `index.ts` file with the template supplied below
3. Restart the server

## Package Index Template

```js
// packages/<your-package>/index.ts
import { IResolvers } from '../../../generated/graphql';
import { GraphQLContext } from '../../types';
import { ExtensionAPI } from '../../localPackages';
import gql from 'graphql-tag';

export function setup(api: ExtensionAPI) {
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

    const resolvers: IResolvers<GraphQLContext> = {
        Query: {
            newQuery(parent, args, context) {
                // your code here
                return { value: name };
            },
        },
    };

    api.addTypeDefs(typeDefs).addResolvers(resolvers);
}
```

## Working Example

See [`src/packages/greeting/`](/src/packages/greeting/) for an example of a package that fetches data from a remote API.

## Caveats

GraphQL packages do not have any enforced ordering right now, meaning packages have to be written in a way where they don't assume what order they've been merged into the overall schema with.

The ordering is dependent on the results of a readdir system call, which is platform-specific. In the future we can discuss introducing some form of dependency declaration/resolution so we have constraints to build an ordering from.
