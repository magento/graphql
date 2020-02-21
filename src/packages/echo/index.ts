import { IResolvers } from '../../../generated/graphql';
import { EchoDataSource } from './EchoDataSource';
import { gql } from 'apollo-server';
import { GraphQLContext } from '../../types';
import { readVar } from '../../env';

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

    const echoClient = EchoDataSource.createClient({
        host: readVar('ECHO_HOST'),
        port: Number(readVar('ECHO_PORT')),
    });
    const dataSources = () => ({
        echo: new EchoDataSource({ echoClient }),
    });

    return { typeDefs, resolvers, dataSources };
}
