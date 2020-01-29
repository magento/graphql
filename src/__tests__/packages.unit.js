const { join } = require('path');
const { gql } = require('apollo-server');
const { getAllPackages, mergePackageConfigs } = require('../packages');

test('getAllPackages finds a single package', async () => {
    const packagesDir = join(__dirname, '__fixtures__', 'packages-case-1');
    const [firstPkg] = await getAllPackages(packagesDir);
    expect(firstPkg.name).toBe('foo-package');
});

test('getAllPackages finds > 1 package', async () => {
    const packagesDir = join(__dirname, '__fixtures__', 'packages-case-2');
    const packages = await getAllPackages(packagesDir);
    expect(packages.length).toBe(2);
    // Note: We can't depend on ordering yet as it's dependent on
    // fs ordering at the moment, which isn't x-platform.
    // See the note in src/packages/README.md for more information
    expect(packages.find(p => p.name === 'foo-package')).toBeTruthy();
    expect(packages.find(p => p.name === 'bar-package')).toBeTruthy();
});

test('getAllPackages warns but does not fail when pkg index is malformed', async () => {
    const warnStub = jest.fn();
    jest.spyOn(console, 'warn').mockImplementation(warnStub);
    const packagesDir = join(__dirname, '__fixtures__', 'packages-case-3');
    const packages = await getAllPackages(packagesDir);

    expect(packages.length).toBe(0);
    expect(warnStub).toHaveBeenCalledWith(
        expect.stringContaining('Unexpected directory '),
    );
});

test('getAllPackages ignores directories starting with . or _', async () => {
    const warnStub = jest.fn();
    jest.spyOn(console, 'warn').mockImplementation(warnStub);
    const packagesDir = join(__dirname, '__fixtures__', 'packages-case-4');
    const packages = await getAllPackages(packagesDir);

    expect(packages.length).toBe(0);
    expect(warnStub).not.toHaveBeenCalledWith(
        expect.stringContaining('Unexpected directory '),
    );
});

test('mergePackageConfigs merges 2 configs in order', () => {
    const package1 = {
        name: 'pkg1',
        typeDefs: gql`
            type Query {
                foo: String
            }
        `,
        resolvers: {
            Query: {
                foo: () => 'a string',
            },
        },
        dataSources: () => ({ fakeSource: {} }),
    };

    const package2 = {
        name: 'pkg2',
        typeDefs: gql`
            type Query {
                bar: String
            }
        `,
        resolvers: {
            Query: {
                bar: () => 'a second string',
            },
        },
        dataSources: () => ({ anotherFakeSource: {} }),
    };

    const merged = mergePackageConfigs([package1, package2]);
    expect(merged.names).toEqual(['pkg1', 'pkg2']);
    expect(merged.typeDefs).toHaveLength(2);
    expect(merged.resolvers).toHaveLength(2);
    expect(merged.dataSources()).toEqual({
        fakeSource: {},
        anotherFakeSource: {},
    });
});
