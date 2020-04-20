module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    // https://jestjs.io/docs/en/configuration.html#restoremocks-boolean
    // Reset mocks between each test
    restoreMocks: true,
    testPathIgnorePatterns: ['/node_modules|__fixtures__/'],
    globalSetup: './scripts/test-setup.js',
    modulePathIgnorePatterns: ['<rootDir>/dist/'],
};
