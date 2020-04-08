import { join } from 'path';
import { getAllPackages } from '../localPackages';

test('getAllPackages finds a single package', async () => {
    const packagesDir = join(__dirname, '__fixtures__', 'packages-case-1');
    const packages = await getAllPackages(packagesDir);
    expect(Object.keys(packages)).toContain('foo-package');
});

test('getAllPackages finds > 1 package', async () => {
    const packagesDir = join(__dirname, '__fixtures__', 'packages-case-2');
    const packages = await getAllPackages(packagesDir);
    const names = Object.keys(packages);
    expect(names.length).toBe(2);
    expect(names).toContain('foo-package');
    expect(names).toContain('bar-package');
});

test('getAllPackages throws with descriptive error when missing setup function', async () => {
    expect.assertions(1);

    const warnStub = jest.fn();
    jest.spyOn(console, 'warn').mockImplementation(warnStub);
    const packagesDir = join(__dirname, '__fixtures__', 'packages-case-3');

    try {
        await getAllPackages(packagesDir);
    } catch (err) {
        expect(err.message).toContain('Extension is missing setup()');
    }
});

test('getAllPackages ignores directories starting with . or _', async () => {
    const warnStub = jest.fn();
    jest.spyOn(console, 'warn').mockImplementation(warnStub);
    const packagesDir = join(__dirname, '__fixtures__', 'packages-case-4');
    const packages = await getAllPackages(packagesDir);

    expect(Object.keys(packages).length).toBe(0);
    expect(warnStub).not.toHaveBeenCalledWith(
        expect.stringContaining('Unexpected directory '),
    );
});
