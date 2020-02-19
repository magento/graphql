import fetch from 'node-fetch';
import { DocumentNode } from 'graphql';
import { readVar } from './env';
import { URL } from 'url';

// NOTE: We'll need to switch to the OpenWhisk SDK
// instead of invoking functions over HTTP, since
// making a function public makes it accessible to
// _everyone_
//
// Not covering this file with tests because it's
// all going to change

const IO_RUNTIME_HOST = readVar('ADOBE_IO_HOST');
const IO_NAMESPACE = readVar('ADOBE_IO_NAMESPACE');

/**
 * @summary Given an Adobe I/O namespace, will return a list
 *          of all packages that are specified as a Magento
 *          GraphQL extension. A "Magento GraphQL Extension"
 *          is defined as any Adobe I/O *application* that
 *          exposes a function named "graphql"
 */
export async function getAllRemoteGQLSchemas(namespace: string) {
    const packages = await getRemoteMagentoPackages(namespace);
    return Promise.all(
        packages.map(async pkg => {
            // TODO: Document special "graphql"-named action
            const schemaDef: DocumentNode = await invokeFunction({
                action: `${pkg}/graphql`,
            });
            return { schemaDef, pkg };
        }),
    );
}

/**
 * @summary Invoke an Adobe I/O function, optionally
 *          with parameters.
 *
 * @todo Need to switch to use the OpenWhisk SDK, because
 *       functions requiring authentication can't be invoked
 *       via a simple HTTP request
 */
export async function invokeFunction(data: {
    action: string;
    params?: Record<string, any>;
}) {
    const url = new URL(
        `https://${IO_RUNTIME_HOST}/api/v1/web/${IO_NAMESPACE}/${data.action}`,
    );
    if (data.params) {
        for (const [param, value] of Object.entries(data.params)) {
            url.searchParams.set(param, value);
        }
    }
    const response = await fetch(url.toString(), {
        method: data.params ? 'POST' : 'GET',
    });
    return response.json();
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
