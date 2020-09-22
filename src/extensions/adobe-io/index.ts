import { createExtension } from '../../api';
import gql from 'graphql-tag';
import { getAllRemoteGQLSchemas } from './adobe-io';
import { parse } from 'graphql';
import { makeExecutableSchema, SchemaDirectiveVisitor } from 'graphql-tools';
import {
    createFunctionDirectiveVisitor,
    prependPkgNameToFunctionDirectives,
} from './FunctionDirectiveVisitor';

const extensionConfig = {
    ADOBE_IO_HOST: {
        docs: 'Hostname or IP of Adobe I/O',
        default: 'adobeioruntime.net',
    },
    ADOBE_IO_NAMESPACE: {
        docs: 'Namespace to query for Adobe I/O extension packages',
        default: 'ecp-ior',
    },
    IO_API_KEY: {
        docs: 'API Key used to authenticate with Adobe I/O Runtime',
    },
    IO_PACKAGES: {
        docs:
            'A comma-delimited list of Adobe I/O GraphQL Extension packages to enable',
    },
};

export default createExtension(extensionConfig, async (config, api) => {
    const owOpts = {
        api_key: config.get('IO_API_KEY').asString(),
        apihost: config.get('ADOBE_IO_HOST').asString(),
        namespace: config.get('ADOBE_IO_NAMESPACE').asString(),
    };
    const packageNames = config.get('IO_PACKAGES').asStringArray();

    const rawIOSchemaDefs = await getAllRemoteGQLSchemas(packageNames, owOpts);
    const ioSchemaDefs = rawIOSchemaDefs.map(d => ({
        ...d,
        schemaDef: prependPkgNameToFunctionDirectives(
            parse(d.schemaDef),
            d.pkg,
        ),
    }));

    const ioSchema = makeExecutableSchema({
        typeDefs: [
            gql`
                type Query {
                    # The "ignoreMe" query is a temporary hack
                    # to give remote packages a "Query" root type to extend
                    ignoreMe: String
                }
                directive @function(name: String!) on FIELD_DEFINITION
            `,
            // all remote schemas merged in _after_ we've defined
            // both the @function directive and the root "Query" type
            ...ioSchemaDefs.map(io => io.schemaDef),
        ],
    });

    const ioVisitor = createFunctionDirectiveVisitor(owOpts);
    // Decorate @function directives with the proper Adobe I/O
    // package name
    SchemaDirectiveVisitor.visitSchemaDirectives(ioSchema, {
        // @ts-ignore Wrong types in graphql-tools@5.0.0.
        // Logged a bug: https://github.com/Urigo/graphql-tools/issues/1376
        function: ioVisitor,
    });

    api.stitchSubschema(ioSchema);
});
