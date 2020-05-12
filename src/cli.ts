import { start } from './server';
import { prepareForServer } from './api';
import { createEnvConfigReader } from './framework/config';

export const cliConfig = {
    PORT: {
        docs: 'Port for GraphQL server to listen on',
        default: 4000,
    },
    HOST: {
        docs: 'Host for GraphQL server to listen on',
        default: '0.0.0.0',
    },
};

/**
 * @summary Main entry point for the CLI, invoked
 *          from the magento-graphql binary
 *
 * @todo    - Add a command to list all config options
 *            for framework + loaded extensions
 */
export async function run() {
    const config = createEnvConfigReader(cliConfig);
    const { schema, context } = await prepareForServer();

    await start({
        host: config.get('HOST').asString(),
        port: config.get('PORT').asNumber(),
        schema,
        context,
    });
}
