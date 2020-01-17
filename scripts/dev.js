/**
 * This is a small script designed to help you iterate quickly locally.
 *
 * Note that a build tool like Gulp is _not_ used because shoving TypeScript
 * into it just makes things slower (TypeScript's own incremental builder is
 * significantly faster).
 *
 * This script really exists 2 get 2 parallel tasks running for you:
 *  1. TypeScript's incremental build server
 *  2. File watcher to rebuild proto/gRPC fixtures on change
 *
 * If this script does not work for you, and you'd like to skip using it,
 * you can always start the TypeScript incremental compilation with
 * `npx tsc --watch`, and build fixtures with `node scripts/protogen.js`.
 */

const chalk = require('chalk');
const debounce = require('debounce');
const chokidar = require('chokidar');
const stripAnsi = require('strip-ansi');
const { spawn } = require('child_process');
const { invokeProtoc } = require('./protogen');

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

chokidar.watch(['protosets/app.protoset']).on(
    'all',
    debounce(async () => {
        console.log(chalk`{green gRPC}: Running Code Generation`);
        try {
            await invokeProtoc();
            console.log(chalk`{green gRPC}: Code Generation completed`);
        } catch (err) {
            console.error(chalk`{red gRPC}: Code Generation failed`);
            console.error(err.stderr);
        }
    }, 60),
);
