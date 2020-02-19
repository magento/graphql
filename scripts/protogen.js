const { mkdir, readFile } = require('fs').promises;
const { join } = require('path');
const execa = require('execa');
const protobuf = require('protobufjs');

const EXE_EXT = process.platform === 'win32' ? '.exe' : '';
const GEN_DIR = join(__dirname, '..', 'generated');

const descriptorProtoPath = require.resolve(
    'grpc-tools/bin/google/protobuf/descriptor.proto',
);
const protosetPath = require.resolve('../protosets/app.protoset');
const protocPath = join(require.resolve('grpc-tools/bin/protoc', EXE_EXT));
const jsPluginPath = join(
    require.resolve('grpc-tools/bin/grpc_node_plugin'),
    EXE_EXT,
);
const tsPluginPath = join(
    require.resolve('ts-protoc-gen/bin/protoc-gen-ts'),
    EXE_EXT,
);

const getProtoFilesFromProtoset = async () => {
    const root = await protobuf.load(descriptorProtoPath);

    const descriptorSet = root.lookup('google.protobuf.FileDescriptorSet');

    const protoset = await readFile(protosetPath);
    const message = descriptorSet.decode(protoset);

    return (
        message.file
            // the "google-protobuf" package already ships with
            // pre-compiled fixtures for well-known protos, so we can skip
            .filter(f => !f.package.startsWith('google/protobuf'))
            .map(f => f.name)
    );
};

const invokeProtoc = (module.exports.invokeProtoc = async () => {
    const protoFiles = await getProtoFilesFromProtoset();
    const args = [
        `--plugin=protoc-gen-grpc=${jsPluginPath}`,
        `--plugin=protoc-gen-ts=${tsPluginPath}`,
        `--descriptor_set_in=protosets/app.protoset`,
        // Note: The "namespace_prefix" option here is _super_ important,
        // or we'll end up with generated protobuf classes that don't
        // match the gRPC method signatures
        `--js_out=namespace_prefix=proto,import_style=commonjs_strict,binary:${GEN_DIR}`,
        `--ts_out=service=grpc-node:${GEN_DIR}`,
        `--grpc_out=${GEN_DIR}`,
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
