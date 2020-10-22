# Logging

The Magento GraphQL server uses a wrapper around [`pino`](https://github.com/pinojs/pino) for logging. The design of `pino` limits the impact that logging has on the performance of the production server, by moving many processing operations to a separate process.

## Configuration

You can configure both the log level and the log file location using the `LOG_FILE` and `LOG_LEVEL` configuration options. See [`CONFIGURATION.md`](CONFIGURATION.md) for more info.

## Logging in Local Dev

In local development, logs are written to the location specified with the `LOG_FILE` configuration option. For easier viewing, the [`pino-pretty`](https://github.com/pinojs/pino-pretty) binary can be piped the contents of the log file. On \*nix systems, this can be done with

```sh
# app.log should be replaced with the path to your log file
tail -f app.log | npx pino-pretty
```

## Format

Logs are written as [`ndjson`](http://ndjson.org/)
