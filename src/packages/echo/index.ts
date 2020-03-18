import { IResolvers } from '../../../generated/graphql';
import gql from 'graphql-tag';
import { GraphQLContext } from '../../types';
import { readVar } from '../../env';
import { EchoService } from '../../services/EchoService';
import { ExtensionAPI } from '../../localPackages';

// Note: This is an example of a "local package" or an "in-process"
// extension. Currently, there is no differentiation in the API
// between our official code and 3rd party packages. We'll need
// to consider if this API will fit well for folks writing
// and distributing extensions authored outside this repo

export function setup(api: ExtensionAPI) {
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

    const echo = new EchoService({
        host: readVar('ECHO_HOST').asString(),
        port: readVar('ECHO_PORT').asNumber(),
    });

    // 3rd parties probably won't have access to `IResolvers`.
    // Even if they do, though, it'll only have types for our
    // core resolvers. If we encourage folks to author extensions
    // in TypeScript, we'll need to make it easy for extensions
    // to auto-gen types, similar to what we do in this application
    const resolvers: IResolvers<GraphQLContext> = {
        Query: {
            echo: async (_parent, args) => {
                const result = await echo.greet(args.request.name);
                return { greeting: result };
            },
        },
    };

    api.addTypeDefs(typeDefs).addResolvers(resolvers);
}
