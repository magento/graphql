const { mkdir, readdir } = require('fs').promises;
const { join } = require('path');
const execa = require('execa');

const EXE_EXT = process.platform === 'win32' ? '.exe' : '';
const GEN_DIR = join(__dirname, '..', 'generated');

const protocPath = join(require.resolve('grpc-tools/bin/protoc', EXE_EXT));
const jsPluginPath = join(
    require.resolve('grpc-tools/bin/grpc_node_plugin'),
    EXE_EXT,
);
const tsPluginPath = join(
    require.resolve('ts-protoc-gen/bin/protoc-gen-ts'),
    EXE_EXT,
);

const invokeProtoc = (module.exports.invokeProtoc = async () => {
    const protoDir = join(__dirname, '../protobufs');
    const protoFiles = (await readdir(protoDir)).filter(v =>
        v.endsWith('.proto'),
    );

    const args = [
        `--plugin=protoc-gen-grpc=${jsPluginPath}`,
        `--plugin=protoc-gen-ts=${tsPluginPath}`,
        // Note: The "namespace_prefix" option here is _super_ important,
        // or we'll end up with generated protobuf classes that don't
        // match the gRPC method signatures
        `--js_out=namespace_prefix=proto,import_style=commonjs_strict,binary:${GEN_DIR}`,
        `--ts_out=service=grpc-node:${GEN_DIR}`,
        `--grpc_out=${GEN_DIR}`,
        `--proto_path=/Users/andrewlevine/magento-graphql/protobufs`,
        ...protoFiles,
    ];

    await mkdir(GEN_DIR, { recursive: true });
    const { stdout } = await execa(protocPath, args);

    return { stdout };
});

// If invoked directly from the CLI, do a single run
if (require.main === module) {
    invokeProtoc()
        .then(({ stdout }) => console.log(stdout))
        .catch(err => {
            console.error(err);
            process.exit(1);
        });
}
