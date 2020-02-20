import { IResolvers } from '../../../generated/graphql';
import { EchoDataSource } from './EchoDataSource';
import { gql } from 'apollo-server';
import { GraphQLContext } from '../../types';

export function setup() {
    const typeDefs = gql`
        input EchoRequest {
            name: String!
        }

        type EchoReply {
            greeting: String
        }

        type Query {
            echo(request: EchoRequest!): EchoReply
        }
    `;

    type Context = GraphQLContext<{ echo: EchoDataSource }>;
    const resolvers: IResolvers<Context> = {
        Query: {
            echo: async (_parent, args, context) => {
                const { echo } = context.dataSources;
                return {
                    greeting: await echo.greet(args.request.name),
                };
            },
        },
    };

    const { ECHO_HOST = '0.0.0.0', ECHO_PORT = '9001' } = process.env;
    const echoClient = EchoDataSource.createClient({
        host: ECHO_HOST,
        port: Number(ECHO_PORT),
    });
    const dataSources = () => ({
        echo: new EchoDataSource({ echoClient }),
    });

    return { typeDefs, resolvers, dataSources };
}
