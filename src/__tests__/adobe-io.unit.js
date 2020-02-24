const getModuleWithMockedInvoke = invokeMock => {
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
    return require('../adobe-io');
};

beforeEach(() => {
    process.env.IO_API_KEY = 'IO_API_KEY';
    process.env.ADOBE_IO_HOST = 'ADOBE_IO_HOST';
    process.env.ADOBE_IO_NAMESPACE = 'ADOBE_IO_NAMESPACE';
});

afterEach(() => {
    delete process.env.IO_API_KEY;
    delete process.env.ADOBE_IO_HOST;
    delete process.env.ADOBE_IO_NAMESPACE;
});

test('getAllRemoteGQLSchemas fetches schema definitions from all gql packages', async () => {
    // Note: 'store-locator-extension-0.0.1 is currently hardcoded as the only
    // remote gql package in adobe-io.ts. Will need to mock the invoke call
    // obtaining the list when that implementation is complete.
    const invokeMock = jest.fn().mockImplementation(async opts => {
        if (opts.name.endsWith('/graphql')) {
            return { typeDefs: {} };
        }
        throw new Error('Unexpected invoke call');
    });
    const { getAllRemoteGQLSchemas } = getModuleWithMockedInvoke(invokeMock);

    const result = await getAllRemoteGQLSchemas('namespace');
    const pkgs = result.map(r => r.pkg);
    expect(pkgs).toEqual(['store-locator-extension-0.0.1']);
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

    expect(getAllRemoteGQLSchemas('namespace')).rejects.toThrow(
        /gql meta func failure/,
    );
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
        invokeRemoteResolver({
            action: 'pkgname/testfunc',
            resolverData,
        }),
    ).resolves.toEqual('expected result');
    const passedParams = invokeMock.mock.calls[0][0].params;
    expect(passedParams.resolverData).toBe(JSON.stringify(resolverData));
});
