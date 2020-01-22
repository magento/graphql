import { ApolloServer } from 'apollo-server';
import { getAllPackages, mergePackageConfigs } from './packages';
import { join } from 'path';

export async function main() {
    const pkgsRoot = join(__dirname, 'packages');
    console.log('Fetching config for Magento GraphQL packages');
    const pkgs = await getAllPackages(pkgsRoot);
    const { names, typeDefs, resolvers, dataSources } = mergePackageConfigs(
        pkgs,
    );
    console.log(`Found ${pkgs.length} package(s): ${names.join(', ')}`);

    const server = new ApolloServer({
        typeDefs,
        resolvers,
        dataSources,
    });
    const serverInfo = await server.listen();
    console.log(`GraphQL server is running at: ${serverInfo.url}`);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
