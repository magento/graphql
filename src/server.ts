import fastify, { FastifyRequest } from 'fastify';
import fastifyGQL from 'fastify-gql';
import { readVar } from './framework/env';
import { assert } from './assert';
import {
    prepareForServer,
    MagentoGraphQLOpts,
} from './framework/prepareForServer';

type MagentoGraphQLServerOpts = {
    localExtensionPathResolver?: MagentoGraphQLOpts['localExtensionPathResolver'];
};

export default async function(opts: MagentoGraphQLServerOpts) {
    const { schema, context } = await prepareForServer(opts);
    const fastifyServer = fastify();
    fastifyServer.register(fastifyGQL, {
        schema,
        graphiql: 'playground',
        path: '/graphql',
        jit: 10,
        context: (req: FastifyRequest) => context(req.headers),
    });

    await fastifyServer.listen(readVar('PORT').asNumber());
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
