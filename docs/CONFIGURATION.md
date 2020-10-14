# Configuring the Magento GraphQL Server

Following the recommendations of the [The Twelve-Factor App](https://12factor.net/config) methodology, all configuration is supplied to the server via environment variables.

When using the `magento-graphql` binary, you'll need to be sure you've exposed your environment variables prior to running the server. This can be done:

-   In your shell
-   In your `.bashrc` or `.bash_profile`
-   In your Docker config
-   etc

## Available Configuration

Running `bin/magento-graphql config` will write a sample file to stdout including descriptions of all available configuration options.

An up-to-date copy of this file is also available in [`.env`](../.env).
