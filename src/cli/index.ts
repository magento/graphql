import { start } from '../server';
import meow from 'meow';
import chalk from 'chalk';
import { prepareForServer, getFrameworkConfig } from '../framework';
import { printSchema } from 'graphql';

/**
 * @summary Entry Point to the CLI
 */
export async function run() {
    const cli = meow(`
        Usage: magento-graphql [Command]
         
        Commands:
          start   Start the GraphQL server
          config  Print default configuration
          schema  Print GraphQL schema

        Options:
          --help     Show this screen
          --version  Show version
    `);

    const [command] = cli.input as [keyof typeof commands];

    if (!command) {
        // Default to starting the server if no command is provided
        commands.start();
        return;
    }

    if (commands.hasOwnProperty(command)) {
        await commands[command]();
        return;
    }

    console.error(
        chalk`{red Unrecognized command line usage. See {bold --help} for usage}`,
    );
    cli.showHelp(1);
}

const commands = {
    /**
     * @summary Start the HTTP server, and bind /graphql to the GraphQL engine
     */
    async start() {
        const config = getFrameworkConfig();
        const { schema, context } = await prepareForServer();

        await start({
            host: config.get('HOST').asString(),
            port: config.get('PORT').asNumber(),
            schema,
            context,
            useUnsupportedApollo: config
                .get('UNSUPPORTED_APOLLO_SERVER')
                .asBoolean(),
        });
    },

    /**
     * @summary Generate a list of all GraphQL server options,
     *          and write to stdout. Uses .env format used by
     *          many tools, include Docker
     */
    config() {
        const config = getFrameworkConfig();

        let lines = config.keys().map(key => {
            const defaultValue = config.defaultValue(key).asString();
            return `# ${config.describe(key)}\n${key}=${defaultValue}`;
        });

        console.log(lines.join('\n'));
    },

    /**
     * @summary Generate a definition of the GraphQL
     *          schema using the official GraphQL IDL,
     *          and write to stdout
     */
    async schema() {
        const { schema } = await prepareForServer();
        console.log(printSchema(schema));
    },
};
