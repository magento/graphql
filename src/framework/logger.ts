import pino, { Level } from 'pino';

type LogOpts = {
    /**
     * @summary Path to log file. Stream support only recommended for testing,
     *          and will be non-optimal in production
     */
    dest: string | NodeJS.WritableStream;
    /**
     * @summary Log4j-style log level
     */
    level: LogLevel;
};

export type LogLevel = Level;
export type Logger = pino.Logger;

/**
 * @summary Create a new Magento GraphQL Framework logger.
 */
export function createLogger({ dest, level }: LogOpts): Logger {
    const destStream = typeof dest === 'string' ? pino.destination(dest) : dest;
    const logger = pino({ level }, destStream);

    return logger;
}
