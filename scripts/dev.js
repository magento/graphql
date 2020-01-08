const chalk = require('chalk');
const debounce = require('debounce');
const chokidar = require('chokidar');
const stripAnsi = require('strip-ansi');
const { spawn } = require('child_process');
const { invokeProtoc, getProtoPaths } = require('./protogen');

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

chokidar.watch([...getProtoPaths(), 'services.json']).on(
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
