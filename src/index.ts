import { assert } from './assert';
import { ApolloServer, gql } from 'apollo-server';
import { credentials } from 'grpc';
import { promisify } from 'util';
import { EchoRequest } from '../generated/echo_pb';
import { EchoClient } from '../generated/echo_grpc_pb';

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

    const client = new EchoClient(
        `${ECHO_HOST}:${ECHO_PORT}`,
        credentials.createInsecure(),
    );

    const getGreeting = promisify(client.greet.bind(client));

    const resolvers = {
        Query: {
            echo: async (parent: any, args: any) => {
                const message = new EchoRequest();
                message.setName(args.request.name);

                const result = await getGreeting(message);
                assert(result, 'Unexpected response from Echo API');

                return { greeting: result.getGreeting() };
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
