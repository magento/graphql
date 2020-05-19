import { join } from 'path';
import { collectLocalExtensions } from '../localExtensions';

test('collectLocalExtensions finds a single package in a single root', async () => {
    const packagesDir = join(__dirname, '__fixtures__', 'packages-case-1');
    const { extensions } = await collectLocalExtensions([packagesDir]);
    const extNames = extensions.map(e => e.name);
    expect(extNames).toContain('@vendor/magento-graphql-foo');
});

test('collectLocalExtensions finds > 1 package in a single root', async () => {
    const packagesDir = join(__dirname, '__fixtures__', 'packages-case-2');
    const { extensions } = await collectLocalExtensions([packagesDir]);
    const extNames = extensions.map(e => e.name);
    expect(extNames.length).toBe(2);
    expect(extNames).toContain('@vendor/magento-graphql-bar');
    expect(extNames).toContain('@vendor/magento-graphql-foo');
});

test('collectLocalExtensions throws with descriptive error when missing setup function', async () => {
    expect.assertions(1);

    const warnStub = jest.fn();
    jest.spyOn(console, 'warn').mockImplementation(warnStub);
    const packagesDir = join(__dirname, '__fixtures__', 'packages-case-3');

    try {
        await collectLocalExtensions([packagesDir]);
    } catch (err) {
        expect(err.message).toMatch(
            /An extension did not export any configuration/,
        );
    }
});
