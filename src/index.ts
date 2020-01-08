import { assert } from './assert';
import { ApolloServer, gql } from 'apollo-server';
import { credentials } from 'grpc';
import { promisify } from 'util';
import { ProductListRequest } from '../generated/app/code/Magento/CatalogProductApi/etc/product_pb.js';
import { CatalogClient } from '../generated/app/code/Magento/CatalogProductApi/etc/product_grpc_pb';
import { FieldMask } from 'google-protobuf/google/protobuf/field_mask_pb';

const typeDefs = gql`
    type Product {
        id: String
        name: String
        description: String
    }

    type Query {
        products: [Product]
    }
`;

export async function main() {
    const client = new CatalogClient(
        '0.0.0.0:9001',
        credentials.createInsecure(),
    );

    const getProductList = promisify(client.getProductList.bind(client));

    const resolvers = {
        Query: {
            products: async (parent: any, args: any) => {
                const message = new ProductListRequest();
                message.setStore('1');
                const attrMask = new FieldMask();
                attrMask.setPathsList(['name', 'description']);
                message.setAttributecodes(attrMask);

                const result = await getProductList(message);
                assert(result, 'Unexpected response from Products API');

                const { dataList } = result.toObject();
                return dataList.map(d => ({
                    name: d.name && d.name.value,
                    description: d.description && d.description.value,
                    id: d.id,
                }));
            },
        },
    };

    // @ts-ignore We don't really get type-safety here anyway
    const server = new ApolloServer({ typeDefs, resolvers });
    const serverInfo = await server.listen();
    console.log(`GraphQL server is running at: ${serverInfo.url}`);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
