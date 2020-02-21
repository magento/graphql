# Code Generation

This project relies on several different forms of code generation. They're documented here to provide context for future developers.

When working locally, all code generation can happen automatically using `npm run watch`, which will run an initial build and then watch for changes.

## TypeScript

Application source code ([`src`](../src)) is authored in [TypeScript](https://www.typescriptlang.org/), and compiled to the `dist` directory.

## GraphQL Schema types for TypeScript

We want to ensure, at compile time, that the values returned from resolvers match the types specified in the schema. We'd also like for developers to get hints from their editors as they work. As a reminder, you typically declare schema/resolver pairs in the following way:

```js
const typeDefs = gql`
    input EchoRequest {
        value: String
    }

    type EchoReply {
        value: String
    }

    type Query {
        echo(input: EchoRequest): EchoReply
    }
`;

const resolvers = {
    Query: {
        // Arguments are strictly typed
        echo: (parent, args) => {
            // return value is strictlytyped
        },
    },
};
```

In the example above, we generate code that:

1. Adds strict typing/hinting to the `parent` and `args` parameter to a resolver
2. Adds strict typing to the return value of all resolvers

This work is done via [GraphQL Code Generator](https://graphql-code-generator.com/) (configured in [`codegen.yml`](../codegen.yml)) and written to the `generated` directory.

## gRPC/Protocol Buffer Fixtures

When working with [Protocol Buffers (Protobufs)](https://developers.google.com/protocol-buffers), you generate DTOs (based on one or several `.proto` files) that handle validating/encoding/serializing messages.

When working with [`gRPC`](https://grpc.io/), you generate classes that receive protobuf DTOs and abstract away sending and receiving via HTTP/2.

[`scripts/protogen.js`](../scripts/protogen.js) takes care of grabbing `.protoset` files from the `generated` directory and generating these fixtures via the [Protocol Buffers Compiler (`protoc`)](https://github.com/protocolbuffers/protobuf).

The wonderful [`ts-protoc-gen`](https://github.com/improbable-eng/ts-protoc-gen) plugin for `protoc` generates TypeScript types for both gRPC and Protobuf fixtures.

All generated fixtures are written to the `generated` directory.
