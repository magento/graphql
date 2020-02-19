// the env module eagerly imports the variables file
// as a side-effect on module initialization. Instead of
// opting for DI in the module, we use a helper to get a
// fresh copy of the module with a stubbed variables.json
// for each test
const getModuleUnderTestWithConf = conf => {
    jest.resetModules();
    jest.mock('../variables.json', () => conf);
    return require('..');
};

test('readVar returns default value when one is not specified', () => {
    const { readVar } = getModuleUnderTestWithConf({
        FOO: {
            default: 'abc',
            description: 'anything',
        },
    });
    expect(readVar('FOO')).toBe('abc');
});

test('readVar favors process.env over default val', () => {
    const { readVar } = getModuleUnderTestWithConf({
        FOO: {
            default: 'abc',
            description: 'anything',
        },
    });
    process.env.FOO = 'def';
    expect(readVar('FOO')).toBe('def');
    delete process.env.FOO;
});

test('readVar favors process.env over default val', () => {
    const { readVar } = getModuleUnderTestWithConf({
        FOO: {
            default: 'abc',
            description: 'anything',
        },
    });
    process.env.FOO = 'def';
    expect(readVar('FOO')).toBe('def');
    delete process.env.FOO;
});

test('readVar coerces non-string default value to string', () => {
    const { readVar } = getModuleUnderTestWithConf({
        FOO: {
            default: 1,
            description: 'anything',
        },
    });
    expect(readVar('FOO')).toEqual('1');
});

test('readVar null default === required', () => {
    const { readVar } = getModuleUnderTestWithConf({
        FOO: {
            default: null,
            description: 'anything',
        },
    });
    const fn = () => readVar('FOO');
    expect(fn).toThrow(/missing required/i);
});

test('isVarDefined is true for user-defined vars', () => {
    const { isVarDefined } = getModuleUnderTestWithConf({
        FOO: {
            default: null,
            description: 'anything',
        },
    });
    process.env.FOO = 'any value';
    expect(isVarDefined('FOO')).toBe(true);
    delete process.env.FOO;
});

test('isVarDefined is false for vars not defined by user', () => {
    const { isVarDefined } = getModuleUnderTestWithConf({
        FOO: {
            default: null,
            description: 'anything',
        },
    });
    expect(isVarDefined('FOO')).toBe(false);
});
