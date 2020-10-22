import { contextBuilder } from './contextBuilder';
import { buildFrameworkSchema } from './schema';
import { createLogger, LogLevel, Logger } from './logger';
import { getFrameworkConfigFromEnv, FrameworkConfig } from './config';

type Opts = {
    /**
     * @summary Optionally provide framework config. Defaults to reading from env vars
     */
    config?: FrameworkConfig;
    /**
     * @summary Optionally override the built-in logger
     */
    logger?: Logger;
};

/**
 * @summary Creates a new executable GraphQL schema and context
 *          function that can be used with any node HTTP library
 */
export async function prepareForServer({
    config = getFrameworkConfigFromEnv(),
    logger,
}: Opts = {}) {
    if (!logger) {
        logger = createLogger({
            dest: config.get('LOG_FILE').asString(),
            level: config.get('LOG_LEVEL').asString() as LogLevel,
        });
    }

    const schema = await buildFrameworkSchema({ config, logger });
    const context = contextBuilder({ schema, logger });

    return { schema, context, logger };
}
