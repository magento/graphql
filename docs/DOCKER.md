# Docker

## Example Usage

1. Run `docker build --tag graphql:latest .` to build the image
2. Copy the `sample.env` file from the root of this repository to another location you'll remember, and customize the configuration.
    - See [`CONFIGURATION.md`](CONFIGURATION.md) for more info
3. Run `docker run -p 8008:8008 --env-file PATH_TO_ENV_FILE graphql:latest`, replacing `PATH_TO_ENV_FILE` with the location of your `sample.env` from the previous step
    - Note: `8008:8008` is [shorthand](https://docs.docker.com/engine/reference/commandline/run/#publish-or-expose-port--p---expose) to specify the GraphQL server's ports both in the container and on the host.
