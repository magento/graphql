# Development

## First Time Setup

1. Clone the repository
2. Run `npm install` to fetch dependencies
3. Run `npm run build` to compile the application
4. Run `npm run start` to start the server. You'll be prompted with instructions to add the necessary config

## Development Scripts

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

Runs a full, clean build of `@magento/graphql`, then runs a file-watcher to handle incremental compilation. Useful for quicker cycles during local development.

See [`CODEGEN.md`](CODEGEN.md) for a detailed overview of what's generated during a build.

```sh
> npm run watch
```

## Running Tests

### Unit Tests

```sh
> npx jest unit
```

### Integration Tests

```sh
> npx jest int
```

### Unit and Integration Tests

```sh
> npx jest
```
