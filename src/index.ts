import { mergeSchemas } from 'graphql-tools';
import fastify, { FastifyRequest } from 'fastify';
import fastifyGQL from 'fastify-gql';
import { join } from 'path';
import { readVar, hasVar } from './framework/env';
import { assert } from './assert';
import { contextBuilder } from './framework/contextBuilder';
import { collectLocalExtensions } from './framework/collectLocalExtensions';
import { collectRemoteExtensions } from './framework/collectRemoteExtensions';

// TODO: Break out execution of `main`
// to bin/magentographql. Server can then be used
// either programatically or via a binary that gets
// npm installed globally
main().catch(err => {
    console.error(err);
    process.exit(1);
});

export async function main() {
    const localPackagesRoot = join(__dirname, 'extensions');
    const localExtensions = await collectLocalExtensions([
        // TODO: allow for customization of extension roots,
        // and default to including built-ins + (cwd + node_modules)
        localPackagesRoot,
    ]);
    const schemas = [...localExtensions.schemas, ...localExtensions.typeDefs];
    if (hasVar('IO_PACKAGES')) {
        const packages = readVar('IO_PACKAGES').asArray();
        schemas.push(await collectRemoteExtensions(packages));
    }

    const fastifyServer = fastify();
    fastifyServer.register(fastifyGQL, {
        schema: mergeSchemas({
            // @ts-ignore Types are wrong. The lib's implementation
            // already merges this array with `typeDefs`
            // https://github.com/Urigo/graphql-tools/blob/03b70c3f3dc71bdb846aa02bdd645ab4b3a96a87/src/stitch/mergeSchemas.ts#L106-L108
            subschemas: schemas,
            resolvers: localExtensions.resolvers,
            // The mergeSchemas function, by default, loses built-in
            // directives (even though they're required by the spec).
            mergeDirectives: true,
        }),
        graphiql: 'playground',
        path: '/graphql',
        jit: 10,
        context: (req: FastifyRequest) =>
            contextBuilder({
                extensions: localExtensions.extensions,
                headers: req.headers,
            }),
    });

    await fastifyServer.listen(readVar('PORT').asNumber());
    const netAddress = fastifyServer.server.address();
    assert(
        netAddress && typeof netAddress === 'object',
        'Unexpected binding to pipe/socket',
    );
    // TODO: Figure out if we plan to support TLS. Assumption atm
    // is that the server will always sit behind something else
    // where TLS terminates, making it unnecessary
    const address = `http://${netAddress.address}:${netAddress.port}`;

    console.log(`Server listening: ${address}`);
    console.log(`graphiql UI: ${address}/playground`);
}
