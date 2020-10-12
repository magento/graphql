import fastify, { FastifyRequest } from 'fastify';
import fastifyGQL from 'fastify-gql';
import { assert } from './assert';
import { GraphQLSchema } from 'graphql';
import { ContextFn } from './framework/types';
import fastifyCORS from 'fastify-cors';

type MagentoGraphQLServerOpts = {
    host: string;
    port: number;
    schema: GraphQLSchema;
    context: ContextFn;
};

/**
 * @summary Fastify-based implementation of the Magento
 *          GraphQL server. Intentionally minimal to allow
 *          us to shift if we decide to go back to a more
 *          typical setup like express + apollo-server-express
 */
export async function start({
    host,
    port,
    schema,
    context,
}: MagentoGraphQLServerOpts) {
    const fastifyServer = fastify();

    fastifyServer.register(fastifyGQL, {
        schema,
        graphiql: 'playground',
        path: '/graphql',
        jit: 10,
        context: (req: FastifyRequest) => context(req.headers),
    });

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
