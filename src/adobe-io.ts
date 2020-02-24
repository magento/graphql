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
export async function getAllRemoteGQLSchemas(namespace: string) {
    const packages = await getRemoteMagentoPackages(namespace);
    // Note: We purposely fail here if _any_ single package has an issue.
    // We could technically recover and proceed with the working packages,
    // skipping the failures, but it's likely better to fail hard as
    // quickly as possible
    return Promise.all(
        packages.map(async pkg => {
            const schemaDef = await invokeGraphQLMetaFunction(pkg);
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
export async function invokeRemoteResolver({
    action,
    resolverData,
}: ResolverInput) {
    const ow = getOWClient();

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
async function invokeGraphQLMetaFunction(pkg: string) {
    const ow = getOWClient();

    type GraphQLMetaPayload = { typeDefs: DocumentNode };
    const response = await ow.actions.invoke<{}, GraphQLMetaPayload>({
        name: `${pkg}/graphql`,
        blocking: true,
        result: true,
    });

    return response.typeDefs;
}

/**
 * @summary Get a new instance of the OpenWhisk client
 */
function getOWClient() {
    // Note: Don't want to keep around state, so we create
    // a new ow instance for each API call. Perf overhead
    // in quick check seems irrelevant (<0.1ms)
    return openwhisk({
        api_key: readVar('IO_API_KEY'),
        apihost: readVar('ADOBE_IO_HOST'),
        namespace: readVar('ADOBE_IO_NAMESPACE'),
    });
}

/**
 * @summary Find all packages within a namespace
 *          that are Magento GraphQL packages.
 *
 * @todo    The list of packages is currently
 *          hard-coded. In the future, this function
 *          will return a list of all I/O apps in an
 *          I/O namespace that expose a function named
 *          "graphql"
 */
async function getRemoteMagentoPackages(namespace: string) {
    return ['store-locator-extension-0.0.1'];
}
