# npm Scripts

### build

Runs a production build of `@magento/graphql`. Typically used prior to publishing to `npm`, but also useful for one-off local builds.

See [`CODEGEN.md`](CODEGEN.md) for a detailed overview of what's generated during a build.

```sh
> npm run build
```

### start

Runs the most recently built version of `@magento/graphql` from `dist`. Does not perform any compilation of its own.

```sh
> npm start
```

### test

Runs all checks performed in CI to validate a build (linting/tests/formatting/etc).

```sh
> npm test
```

### clean

Removes compiled code from `dist` and generated types/fixtures in `generated`

```sh
> npm run clean
```

### format

Runs [`prettier`](https://prettier.io/) to update all code formatting to a standard style.

```sh
> npm run format
```

### watch

Runs a full, clean build of `@magento/graphql`, then runs a file-watcher to handle incremental compilation. Useful for quick iteration during local development.

```sh
> npm run watch
```

### update-config

Updates the sample `.env` in the root of the project with default configuration values. Includes description of all configuration options.

This should be run whenever new configuration values are added to [`src/framework/config.ts`](../src/framework/config.ts)

```sh
> npm run update-config
```
