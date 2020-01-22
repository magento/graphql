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
    console.log(chalk`{red TypeScript}: watcher failed with exit code ${code}`);
    process.exit(1);
});

chokidar
    .watch([
        'protosets/app.protoset', // for gRPC fixtues
        'src/**/*.ts', // for codegen of schema >> TS types
    ])
    .on('all', (modificationType, filename) => {
        const ext = extname(filename);
        switch (true) {
            case ext === '.protoset':
                generateGRPCFixtures();
            case ext === '.ts':
                generateResolverTypes();
        }
    });

const generateGRPCFixtures = debounce(async () => {
    console.log(chalk`{green gRPC}: Running Code Generation`);
    try {
        await invokeProtoc();
        console.log(chalk`{green gRPC}: Code Generation completed`);
    } catch (err) {
        console.error(chalk`{red gRPC}: Code Generation failed`);
        console.error(err.stderr);
    }
}, 60);

const generateResolverTypes = debounce(async () => {
    console.log(chalk`{yellow gql-gen}: Running GraphQL Code Generation`);
    try {
        await execa('gql-gen');
        console.log(chalk`{yellow gql-gen}: GraphQL Code Generation completed`);
    } catch (err) {
        console.error(chalk`{red gql-gen}: GraphQL Code Generation completed`);
        console.error(err.stderr);
    }
}, 60);
