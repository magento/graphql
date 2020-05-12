import { start } from './server';
import { prepareForServer } from './framework/prepareForServer';
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
    ADOBE_IO_HOST: {
        docs: 'Hostname or IP of Adobe I/O',
        default: 'adobeioruntime.net',
    },
    ADOBE_IO_NAMESPACE: {
        docs: 'Namespace to query for Adobe I/O extension packages',
        default: 'ecp-ior',
    },
    IO_API_KEY: {
        docs: 'API Key used to authenticate with Adobe I/O Runtime',
    },
    IO_PACKAGES: {
        docs:
            'A comma-delimited list of Adobe I/O GraphQL extension packages to enable',
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
    const adobeIOPackages = config.get('IO_PACKAGES').asStringArray();
    const { schema, context } = await prepareForServer({ adobeIOPackages });

    await start({
        host: config.get('HOST').asString(),
        port: config.get('PORT').asNumber(),
        schema,
        context,
    });
}
