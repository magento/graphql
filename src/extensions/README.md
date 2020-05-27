# Extensions

Extensions enable developers to extend the Graph exposed by the `@magento/graphql` server.

## API Status

Expect frequent breaking changes. The API is being [dogfooded](https://en.wikipedia.org/wiki/Eating_your_own_dog_food) while building out API coverage.

For the time being, only extensions in `src/extensions` (first-party) will run automatically. Support for published npm packages will be added as APIs stabilize.

## Requirements

An extension is an [node module](https://docs.npmjs.com/packages-and-modules/), written in JavaScript (or TypeScript), that fulfills the following criteria:

1. Has a `package.json` in its root directory, with a `name` property of the format `@<npm-username>/magento-graphql-<extension-name>`
1. Has a [`main` field in `package.json`](https://docs.npmjs.com/files/package.json#main) pointing to a package entry point
1. Has an entry point that exports the extension's configuration (see `createExtension` API)

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
            echo(root, args) {
                return args.value;
            },
        },
    };

    // Add typeDefs and resolvers
    api.addTypeDefs(typeDefs).addResolvers(resolvers);
});
```
