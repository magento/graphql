import { DocumentNode } from 'graphql';
import { readVar } from './env';
import openwhisk from 'openwhisk';

/**
 * @summary Given an Adobe I/O namespace, will return a list
 *          of all packages that are specified as a Magento
 *          GraphQL extension. A "Magento GraphQL Extension"
 *          is defined as any Adobe I/O *application* that
 *          exposes a function named "graphql"
 */
export async function getAllRemoteGQLSchemas(
    packages: string[],
    io: openwhisk.Options = getOWClientOptsFromEnv(),
) {
    // Note: We purposely fail here if _any_ single package has an issue.
    // We could technically recover and proceed with the working packages,
    // skipping the failures, but it's likely better to fail hard as
    // quickly as possible
    return Promise.all(
        packages.map(async pkg => {
            const schemaDef = await invokeGraphQLMetaFunction(pkg, io);
            return { schemaDef, pkg };
        }),
    );
}

type ResolverInput = {
    action: string;
    resolverData: {
        parent: unknown;
        args: unknown;
    };
};

/**
 * @summary Invoke a remote Adobe I/O GraphQL Resolver function
 */
export async function invokeRemoteResolver(
    { action, resolverData }: ResolverInput,
    io: openwhisk.Options = getOWClientOptsFromEnv(),
) {
    const ow = openwhisk(io);

    type Params = { resolverData: string };
    type RemoteResolverPayload = { result: any };
    const response = await ow.actions.invoke<Params, RemoteResolverPayload>({
        name: action,
        params: { resolverData: JSON.stringify(resolverData) },
        blocking: true,
        result: true,
    });

    // TODO: run-time validation that I/O function response
    // matches required format
    return response.result;
}

/**
 * @summary Invoke the special "graphql" function in a package
 *          to obtain schema + remote resolver specs
 */
async function invokeGraphQLMetaFunction(pkg: string, io: openwhisk.Options) {
    const ow = openwhisk(io);

    type GraphQLMetaPayload = { typeDefs: DocumentNode };
    const response = await ow.actions.invoke<{}, GraphQLMetaPayload>({
        name: `${pkg}/graphql`,
        blocking: true,
        result: true,
    });

    return response.typeDefs;
}

export function getOWClientOptsFromEnv() {
    return {
        api_key: readVar('IO_API_KEY').asString(),
        apihost: readVar('ADOBE_IO_HOST').asString(),
        namespace: readVar('ADOBE_IO_NAMESPACE').asString(),
    };
}
