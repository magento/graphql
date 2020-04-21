#!/usr/bin/env node

/**
 * This is a small script designed to help you iterate quickly locally.
 *
 * Note that a build tool like Gulp is _not_ used because shoving TypeScript
 * into it just makes things slower (TypeScript's own incremental builder is
 * significantly faster).
 *
 * This script really exists to get 3 parallel tasks running for you:
 *  1. TypeScript's incremental build server
 *  2. File watcher to rebuild proto/gRPC fixtures on change
 *  3. File watcher to rebuild TS types for GraphQL schema changes
 *
 * If this script does not work for you, and you'd like to skip using it,
 * you can always run the full build with "npm run build".
 */

const chalk = require('chalk');
const debounce = require('debounce');
const chokidar = require('chokidar');
const stripAnsi = require('strip-ansi');
const { spawn } = require('child_process');
const { invokeProtoc } = require('./protogen');
const { extname } = require('path');
const execa = require('execa');
const { promisify } = require('util');
const rimraf = promisify(require('rimraf'));

init().catch(err => {
    console.error(err);
    process.exit(1);
});

async function init() {
    // start with a clean working dir
    await Promise.all([rimraf('dist'), rimraf('generated')]);

    // Do all codegen _before_ the TypeScript build starts,
    // so we don't have a race condition that causes the
    // first TS build to report type errors
    await Promise.all([generateGRPCFixtures(), generateResolverTypes()]);

    // Run the TypeScript build in watch mode. We're using the tsc CLI
    // directly rather than a tool like Gulp and friends, because those
    // integrations tend to start a fresh build each time, which is laggy
    // even with TypeScript's --inremental option. Running tsc --watch
    // directly yields the fastest iteration cycles
    const ts = spawn(require.resolve('typescript/bin/tsc'), ['--watch']);

    ts.stdout.on('data', v => {
        const cleaned = stripAnsi(v.toString().trim());
        if (cleaned === '') return;
        console.log(chalk`{blue TypeScript}: ${cleaned}`);
    });
    ts.stderr.on('data', v => {
        const cleaned = stripAnsi(v.toString().trim());
        console.log(chalk`{red TypeScript}: ${cleaned}`);
    });
    ts.on('close', code => {
        console.log(
            chalk`{red TypeScript}: watcher failed with exit code ${code}`,
        );
        process.exit(1);
    });

    const debouncedGenGRPC = debounce(generateGRPCFixtures, 60);
    const debouncedGenResolver = debounce(generateResolverTypes, 60);

    chokidar
        .watch(
            [
                'protosets/app.protoset', // for gRPC fixtues
                'src/**/*.ts', // for codegen of schema >> TS types
            ],
            // We ran an initial build, no need to execute again
            { ignoreInitial: true },
        )
        .on('all', (modificationType, filename) => {
            const ext = extname(filename);
            switch (true) {
                case ext === '.protoset':
                    debouncedGenGRPC();
                case ext === '.ts':
                    debouncedGenResolver();
            }
        });
}

const generateGRPCFixtures = async () => {
    console.log(chalk`{green gRPC}: Running Code Generation`);
    try {
        await invokeProtoc();
        console.log(chalk`{green gRPC}: Code Generation completed`);
    } catch (err) {
        console.error(chalk`{red gRPC}: Code Generation failed`);
        console.error(err.stderr);
    }
};

const generateResolverTypes = async () => {
    console.log(chalk`{yellow gql-gen}: Running GraphQL Code Generation`);
    try {
        await execa('gql-gen', { preferLocal: true });
        console.log(chalk`{yellow gql-gen}: GraphQL Code Generation completed`);
    } catch (err) {
        const debugLog = err.stdout
            .split('\n')
            .map(v => `  ${v}`)
            .join('\n');
        console.error(
            chalk`{red gql-gen}: GraphQL Code Generation failed:\n${debugLog}`,
        );
    }
};
