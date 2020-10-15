import fastify, { FastifyRequest } from 'fastify';
import fastifyGQL from 'fastify-gql';
import { ApolloServer } from 'apollo-server-fastify';
import assert from 'assert';
import { GraphQLSchema } from 'graphql';
import { ContextFn } from '../framework';
import fastifyCORS from 'fastify-cors';

type MagentoGraphQLServerOpts = {
    host: string;
    port: number;
    schema: GraphQLSchema;
    context: ContextFn;
    useUnsupportedApollo?: boolean;
};

/**
 * @summary fastify + fastify-gql implementation of the Magento
 *          GraphQL server.
 */
export async function start({
    host,
    port,
    schema,
    context,
    useUnsupportedApollo,
}: MagentoGraphQLServerOpts) {
    const fastifyServer = fastify();

    if (useUnsupportedApollo) {
        const apollo = new ApolloServer({ schema });
        fastifyServer.register(apollo.createHandler());
    } else {
        fastifyServer.register(fastifyGQL, {
            schema,
            graphiql: 'playground',
            path: '/graphql',
            jit: 10,
            context: (req: FastifyRequest) => context(req.headers),
        });
    }

    // TODO: This should never go to prod with a blanket
    // whitelist
    fastifyServer.register(fastifyCORS, {
        origin: true,
    });

    await fastifyServer.listen(port, host);
    const netAddress = fastifyServer.server.address();
    assert(
        netAddress && typeof netAddress === 'object',
        'Unexpected binding to pipe/socket',
    );
    // No TLS support for now. Assumption is that the server
    // will always sit behind something else where TLS terminates,
    // making it unnecessary
    const address = `http://${netAddress.address}:${netAddress.port}`;

    console.log(`Server listening: ${address}`);
    console.log(`graphiql UI: ${address}/playground`);
}
