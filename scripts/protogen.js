const { mkdir } = require('fs').promises;
const { join, dirname } = require('path');
const execa = require('execa');
const SVCS_PATH = require.resolve('../services.json');

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

const getProtoPaths = (module.exports.getProtoPaths = () => {
    // Want uncached because this can be re-invoked
    // multiple times in the same process via a watcher
    delete require.cache[SVCS_PATH];
    const svcs = require('../services.json');
    return Object.values(svcs).reduce((coll, entry) => {
        coll.push(...entry.protos);
        return coll;
    }, []);
});

const invokeProtoc = (module.exports.invokeProtoc = async () => {
    const protoPaths = getProtoPaths();
    const includeDirs = protoPaths.map(p => dirname(p));

    const args = [
        `--plugin=protoc-gen-grpc=${jsPluginPath}`,
        `--plugin=protoc-gen-ts=${tsPluginPath}`,
        `--descriptor_set_in=build/fdsets/app.protoset`,
        // Note: The "namespace_prefix" option here is _super_ important,
        // or we'll end up with generated protobuf classes that don't
        // match the gRPC method signatures
        `--js_out=namespace_prefix=proto,import_style=commonjs_strict,binary:${GEN_DIR}`,
        `--ts_out=service=grpc-node:${GEN_DIR}`,
        `--grpc_out=${GEN_DIR}`,
        ...protoPaths,
    ];

    await mkdir(GEN_DIR, { recursive: true });
    const { stdout } = await execa(protocPath, args);

    return { stdout, protoPaths };
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
