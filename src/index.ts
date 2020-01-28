import {
    ApolloServer,
    introspectSchema,
    makeRemoteExecutableSchema,
    mergeSchemas,
    makeExecutableSchema,
} from 'apollo-server';
import { getAllPackages, mergePackageConfigs } from './packages';
import { join } from 'path';
import { HttpLink } from 'apollo-link-http';
import fetch from 'isomorphic-fetch';
import { assert } from './assert';

export async function main() {
    const pkgsRoot = join(__dirname, 'packages');
    console.log('Fetching config for Magento GraphQL packages');
    const pkgs = await getAllPackages(pkgsRoot);
    const { names, typeDefs, resolvers, dataSources } = mergePackageConfigs(
        pkgs,
    );
    console.log(`Found ${pkgs.length} package(s): ${names.join(', ')}`);

    const monolithSchema = await getExecutableFallbackSchema();
    const localSchema = makeExecutableSchema({ typeDefs, resolvers });
    // Merge Magento core Schema into our schema, favoring the Magento core schema (last-in wins)
    // We don't support extensions for the core fallback schema
    const schema = mergeSchemas({ schemas: [localSchema, monolithSchema] });

    const server = new ApolloServer({
        schema,
        dataSources,
    });
    const serverInfo = await server.listen();
    console.log(`GraphQL server is running at: ${serverInfo.url}`);
}

async function getExecutableFallbackSchema() {
    const uri = process.env.LEGACY_GRAPHQL_URL;
    assert(uri, 'Expected string value for env var LEGACY_GRAPHQL_URL');

    const link = new HttpLink({ uri, fetch: fetch });
    const rawMonolithSchema = await introspectSchema(link);
    return makeRemoteExecutableSchema({
        schema: rawMonolithSchema,
        link,
    });
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
