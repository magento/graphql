import gql from 'graphql-tag';
import {
    FunctionDirectiveVisitor,
    prependPkgNameToFunctionDirectives,
} from './FunctionDirectiveVisitor';
import { getAllRemoteGQLSchemas } from '../framework/adobe-io';
import { parse } from 'graphql';
import { makeExecutableSchema, SchemaDirectiveVisitor } from 'graphql-tools';

export async function collectRemoteExtensions(packages: string[]) {
    const rawIOSchemaDefs = await getAllRemoteGQLSchemas(packages);
    const ioSchemaDefs = rawIOSchemaDefs.map(d => ({
        ...d,
        schemaDef: prependPkgNameToFunctionDirectives(
            parse(d.schemaDef),
            d.pkg,
        ),
    }));
    const pkgNames = ioSchemaDefs.map(s => `  - ${s.pkg}`).join('\n');
    console.log(
        `Found ${ioSchemaDefs.length} remote I/O GraphQL package(s):\n${pkgNames}`,
    );
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
    // Decorate @function directives with the proper Adobe I/O
    // package name
    SchemaDirectiveVisitor.visitSchemaDirectives(ioSchema, {
        // @ts-ignore Wrong types in graphql-tools@5.0.0.
        // Logged a bug: https://github.com/Urigo/graphql-tools/issues/1376
        function: FunctionDirectiveVisitor,
    });

    return ioSchema;
}
