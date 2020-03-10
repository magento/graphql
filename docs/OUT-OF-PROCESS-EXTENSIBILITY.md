# Out of Process Extensibility

The Magento GraphQL server enables developers to extend the graph by adding new queries/mutations/fields/etc via [Adobe I/O Runtime Functions](https://www.adobe.io/apis/experienceplatform/runtime.html). They are packaged as an Adobe I/O _Application_ (built on [OpenWhisk Packages](https://github.com/apache/openwhisk/blob/e12c5de56aaf9e24a180f21f168204cf01125d1f/docs/packages.md)) that we'll call a _GraphQL Extension Package_.

## Writing Your First GraphQL Extension Package

A GraphQL Extension Package is a logical collection of related Adobe I/O functions. It's quick to get started making your own.

**Prerequisites**

-   `node.js` version >= `10.0.0`
-   Adobe I/O Account and namespace

### Create a new Adobe I/O Application

1. Run `npm install -g @adobe/aio-cli`
1. Run `aio app init`
    - Disable `Web Assets` when prompted
    - Enable `Actions: Deploy Runtime actions` when prompted
    - Select `Generic` when prompted for which type of project to generate
    - Enter `graphql` when prompted to enter a name for your first function

### Add the "graphql" Function with a Schema

To signal that an Adobe I/O app is a _GraphQL Extension Package_, it needs to expose a function named `graphql` that meets some requirements. The following steps should be done in the directory of the project you scaffolded in `Create a new Adobe I/O Application`.

1. Run `npm install graphql graphql-tag`
1. Open `actions/graphql/index.js`
1. Paste the following code:

    ```js
    const gql = require('graphql-tag');

    module.exports.main = () => {
        const typeDefs = gql`
            type HelloResponse {
                name: String!
                message: String!
            }

            extend type Query {
                hello(name: String!): HelloResponse!
                    @function(name: "hello-resolver")
            }
        `;

        return {
            statusCode: 200,
            body: JSON.stringify(typeDefs),
        };
    };
    ```

### Create a Resolver Action

With our Schema specified, and a `hello` query defined, we need to create the `hello-resolver` action (we specified this with the `@function` GraphQL directive in the previous step).

1. In the `actions/` directory, create a new folder named `hello-resolver`, and an `index.js` with the following code:

    ```js
    module.exports.main = ({ resolverData }) => {
        const { args } = JSON.parse(resolverData);

        return {
            status: 200,
            body: {
                name: args.name,
                message: `Hello, ${args.name}`,
            },
        };
    };
    ```

1. Open `manifest.yml`, and add paste the following new entry under `actions`:
    ```yaml
    hello-resolver:
        function: actions/hello-resolver/index.js
        inputs:
            resolverData: string
            description: JSON-serialized representation of data for GQL Resolver
        web: 'yes'
        runtime: 'nodejs:10'
    ```

### Deploy to Adobe I/O Runtime

1. Run the following script to deploy your new GraphQL Extension Package to Adobe I/O Runtime
    ```sh
    AIO_RUNTIME_NAMESPACE=your-namespace-here
    AIO_RUNTIME_AUTH=your-auth-here
    aio app deploy
    ```
1. A successful deployment from the `aio` CLI will include the output below. Take note of the full I/O Application name (in this case, `aio-test-0.0.1`). It will be needed for the next step

    ```sh
    > Build actions
    ℹ dist/actions/graphql.zip
    ℹ dist/actions/hello-resolver.zip
    ✔ Build actions

    no web-src, skipping web-src build
    > Deploy actions
    ℹ Info: Deploying package [aio-test-0.0.1]...
    ℹ Info: package [aio-test-0.0.1] has been successfully deployed.

    ℹ Info: Deploying action [aio-test-0.0.1/graphql]...
    ℹ Info: action [aio-test-0.0.1/graphql] has been successfully deployed.

    ℹ Info: Deploying action [aio-test-0.0.1/hello-resolver]...
    ℹ Info: action [aio-test-0.0.1/hello-resolver] has been successfully deployed.

    ℹ Success: Deployment completed successfully.
    ✔ Deploy actions

    no web-src, skipping web-src deploy
    Well done, your app is now online 🏄
    ```

### Configure the Magento GraphQL Server

1. The following variables (defined in `src/env/variables.json`) will need to be set prior to starting the server:
    - `IO_PACKAGES`: A comma-delimited list of GraphQL Extension Packages deployed to Adobe I/O Runtime.
