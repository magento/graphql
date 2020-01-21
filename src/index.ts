import { ApolloServer, gql } from 'apollo-server';
import { EchoDataSource } from './DataSources/EchoDataSource';

const typeDefs = gql`
    input EchoRequest {
        name: String
    }

    type EchoReply {
        greeting: String
    }

    type Query {
        echo(request: EchoRequest): EchoReply
    }
`;

export async function main() {
    const { ECHO_HOST = '0.0.0.0', ECHO_PORT = '9001' } = process.env;
    const echoClient = EchoDataSource.createClient({
        host: ECHO_HOST,
        port: Number(ECHO_PORT),
    });

    const resolvers = {
        Query: {
            echo: async (_parent: unknown, args: any, context: any) => {
                const { echo } = context.dataSources;
                return {
                    greeting: await echo.greet(args.request.name),
                };
            },
        },
    };

    const server = new ApolloServer({
        typeDefs,
        resolvers,
        dataSources: () => ({
            echo: new EchoDataSource({ echoClient }),
        }),
    });
    const serverInfo = await server.listen();
    console.log(`GraphQL server is running at: ${serverInfo.url}`);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
