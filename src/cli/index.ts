import { start } from '../server';
import meow from 'meow';
import chalk from 'chalk';
import { prepareForServer } from '../api';
import { getFrameworkConfig } from '../framework/config';

/**
 * @summary Entry Point to the CLI
 */
export async function run() {
    const cli = meow(`
        Usage
            $ magento-graphql run
            $ magento-graphql config
         
        Options:
            --help     Show this screen
            --version  Show version
    `);

    const [command] = cli.input as [keyof typeof commands];

    if (!command) {
        // Default to running the server is no command is provided
        commands.run();
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
    async run() {
        const config = getFrameworkConfig();
        const { schema, context } = await prepareForServer();

        await start({
            host: config.get('HOST').asString(),
            port: config.get('PORT').asNumber(),
            schema,
            context,
        });
    },

    config() {
        const config = getFrameworkConfig();

        let lines = config.keys().map(key => {
            const value = config.get(key).asString();
            return `# ${config.describe(key)}\nexport ${key}="${value}"`;
        });

        console.log(lines.join('\n'));
    },
};
