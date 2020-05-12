import { Actions } from 'openwhisk';

const getModuleWithMockedInvoke = (invokeMock: Actions['invoke']) => {
    jest.resetModules();
    jest.mock('openwhisk', () => {
        return function openwhiskMock() {
            return {
                actions: {
                    invoke: invokeMock,
                },
            };
        };
    });
    return require('../adobe-io') as typeof import('../adobe-io');
};

const defaultIOOpts = () => ({
    api_key: 'api_key',
    apihost: 'apihost',
    namespace: 'namespace',
});

test('getAllRemoteGQLSchemas fetches schema definitions from all gql packages', async () => {
    const invokeMock = jest.fn().mockImplementation(async opts => {
        if (opts.name.endsWith('/graphql')) {
            return { typeDefs: {} };
        }
        throw new Error('Unexpected invoke call');
    });
    const { getAllRemoteGQLSchemas } = getModuleWithMockedInvoke(invokeMock);

    const result = await getAllRemoteGQLSchemas(
        ['foo-extension-0.0.1'],
        defaultIOOpts(),
    );
    const pkgs = result.map(r => r.pkg);
    expect(pkgs).toEqual(['foo-extension-0.0.1']);
    expect(Object.keys(result[0])).toEqual(['schemaDef', 'pkg']);
});

test('getAllRemoteGQLSchemas rejects graphql meta func call fails', async () => {
    const invokeMock = jest.fn().mockImplementation(async opts => {
        if (opts.name.endsWith('/graphql')) {
            throw new Error('gql meta func failure');
        }
        throw new Error('Unexpected invoke call');
    });
    const { getAllRemoteGQLSchemas } = getModuleWithMockedInvoke(invokeMock);

    expect(
        getAllRemoteGQLSchemas(['foo-extension-0.0.1'], defaultIOOpts()),
    ).rejects.toThrow(/gql meta func failure/);
});

test('invokeRemoteResolver sends serialized resolver data and returns "result" key from payload', async () => {
    const invokeMock = jest.fn().mockImplementation(async opts => {
        if (opts.name === 'pkgname/testfunc') {
            return { result: 'expected result' };
        }
        throw new Error('Unexpected invoke call');
    });
    const { invokeRemoteResolver } = getModuleWithMockedInvoke(invokeMock);

    const resolverData = {
        parent: null,
        args: {},
    };

    expect(
        invokeRemoteResolver(
            {
                action: 'pkgname/testfunc',
                resolverData,
            },
            defaultIOOpts(),
        ),
    ).resolves.toEqual('expected result');
    const passedParams = invokeMock.mock.calls[0][0].params;
    expect(passedParams.resolverData).toBe(JSON.stringify(resolverData));
});
