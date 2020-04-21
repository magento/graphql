import { IResolvers } from '../../../generated/graphql';
import gql from 'graphql-tag';
import { GraphQLContext, ExtensionAPI } from '../../types';
import { readVar } from '../../framework/env';
import { GreetingService } from './GreetingService';

/**
 * @summary Magento GraphQL Extension for the gRPC Greeting service.
 *          Just a small demo to show the API
 */
export function setup(api: ExtensionAPI) {
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
        host: readVar('ECHO_HOST').asString(),
        port: readVar('ECHO_PORT').asNumber(),
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
}
