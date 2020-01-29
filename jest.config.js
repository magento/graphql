module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    globals: {
        'ts-jest': {
            diagnostics: false,
        },
    },
    // https://jestjs.io/docs/en/configuration.html#restoremocks-boolean
    // Reset mocks between each test
    restoreMocks: true,
    testPathIgnorePatterns: ['/node_modules|__fixtures__/'],
};
