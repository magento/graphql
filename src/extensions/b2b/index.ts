import { IResolvers } from '../../../generated/graphql';
import { B2BAPIClient } from './B2BAPIClient';
import { GraphQLContext } from '../../types';
import { readVar } from '../../framework/env';
import { ExtensionAPI } from '../../types';
import { typeDefs } from './typeDefs';
import * as r from './restToGQLType';

// Would be nice to just import this, but
// we want to use it both as a value and as a
// literal type, but TS doesn't support literals
// when using resolveJsonModule
// https://github.com/microsoft/TypeScript/issues/26552
const EXTNAME = '@magento/magento-graphql-b2b';

type Context = GraphQLContext<{
    [EXTNAME]: {
        client: B2BAPIClient;
    };
}>;

export async function setup(api: ExtensionAPI) {
    // Eagerly read config when extension is first starting
    // up. If config is missing we want errors on startup,
    // not when queries start executing
    const apiOpts = {
        adminToken: readVar('B2B_ADMIN_TOKEN').asString(),
        hostname: readVar('LEGACY_REST_HOSTNAME').asString(),
        port: readVar('LEGACY_REST_PORT').asNumber(),
        protocol: readVar('LEGACY_REST_PROTOCOL').asString() as
            | 'http:'
            | 'https:',
    };

    api.extendContext(context => {
        const client = new B2BAPIClient({
            integrationToken: apiOpts.adminToken,
            // TODO: handle a missing legacyToken better.
            // We can't just throw because context functions
            // run even when their own resolvers aren't hit,
            // so this could run on a `productSearch` query,
            // which doesn't require authentication. For now,
            // we'll just hit the Magento REST API with whatever
            // value we do or don't have, and we'll end up with
            // a generic auth error at runtime
            customerToken: context.legacyToken || '',
            ...apiOpts,
        });
        return {
            client,
        };
    });

    const resolvers: IResolvers<Context> = {
        Query: {
            company(root, args, context) {
                const { client } = context[EXTNAME];
                return client.getCompany().then(r.toCompany);
            },
        },
        Company: {
            sales_representative(root, args, context) {
                const { client } = context[EXTNAME];
                return client.getSalesRep().then(r.toSalesRep);
            },
            roles(root, args, context) {
                const { client } = context[EXTNAME];
                return client.getRoles(args).then(r.toRoles);
            },
            role(root, args, context) {
                const { client } = context[EXTNAME];
                return client.getRole(args.id).then(r.toRole);
            },
            team(root, args, context) {
                const { client } = context[EXTNAME];
                return client.getTeam(args.id);
            },
        },
    };

    api.addTypeDefs(typeDefs).addResolvers(resolvers);
}
