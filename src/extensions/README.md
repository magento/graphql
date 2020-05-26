# Extensions

Extensions enable developers to extend the Graph exposed by the `@magento/graphql` server.

## Requirements

An extension must:

1. Have a `package.json` in its root directory, with a `name` property of the format `@<npm-username>/magento-graphql-<extension-name>`
1. Have an entry point module whose default export is the result from calling the `createExtension` API
1. Have a `main` field in `package.json` pointing to the entry point module's path

## Example Extension

### `package.json`

```json
{
    "name": "@your-npm-username/magento-graphql-first-extension",
    "version": "0.1.0",
    "dependencies": {
        "graphql-tag": "^2.10.3"
    },
    "peerDependencies": {
        "@magento/graphql": "^0.0.1"
    }
}
```

### index.js

```js
import gql from 'graphql-tag';
import { createExtension } from '@magento/graphql';

const extensionConfig = {
    SOME_VALUE: {
        docs: 'Describe what SOME_VALUE is used for',
        default: 'a value',
    },
};

export default createExtension(extensionConfig, (config, api) => {
    // Reading config values
    const someValue = config.get('SOME_VALUE');
    // Declare type definitions using the GraphQL Type Language
    // https://graphql.org/learn/schema/#type-language
    const typeDefs = gql`
        extend type Query {
            echo(value: String): String
        }
    `;
    // Declare resolvers
    const resolvers = {
        Query: {
            firstExtension(root, args) {
                return args.value;
            },
        },
    };

    // Add typeDefs and resolvers
    api.addTypeDefs(typeDefs).addResolvers(resolvers);
});
```
