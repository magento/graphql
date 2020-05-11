import { IResolvers } from '../../../generated/graphql';
import gql from 'graphql-tag';
import { GraphQLContext } from '../../types';
import { GreetingService } from './GreetingService';
import { createExtension } from '../../api';

const extensionConfig = {
    ECHO_HOST: {
        docs: 'Hostname or IP of greeting gRPC service',
        default: '0.0.0.0',
    },
    ECHO_PORT: {
        docs: 'Port of greeting gRPC service',
        default: 9001,
    },
};

/**
 * @summary Magento GraphQL Extension for the gRPC Greeting service.
 *          Just a small demo to show the API
 */
export default createExtension(extensionConfig, (config, api) => {
    const typeDefs = gql`
        input GreetingRequest {
            name: String!
        }

        type GreetingReply {
            greeting: String
        }

        type Query {
            greet(request: GreetingRequest!): GreetingReply
        }
    `;

    const greeting = new GreetingService({
        host: config.get('ECHO_HOST').asString(),
        port: config.get('ECHO_PORT').asNumber(),
    });

    const resolvers: IResolvers<GraphQLContext> = {
        Query: {
            greet: async (_parent, args) => {
                const result = await greeting.greet(args.request.name);
                return { greeting: result };
            },
        },
    };

    api.addTypeDefs(typeDefs).addResolvers(resolvers);
});
