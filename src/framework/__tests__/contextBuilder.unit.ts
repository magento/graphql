import { contextBuilder } from '../contextBuilder';

const extDefaults = () => ({
    typeDefs: [],
    resolvers: {},
    schemas: [],
    deps: [],
    context: undefined,
});

test('Namespaces extensions to context', () => {
    const extensions = [
        {
            ...extDefaults(),
            name: '@vendor/magento-graphql-foo',
            context: () => ({ testProp: true }),
        },
    ];
    const context = contextBuilder({
        extensions,
        headers: {},
    });

    expect(context).toHaveProperty('@vendor/magento-graphql-foo');
});

test('Does not persist mutations of context obj passed to extension', () => {
    const extensions = [
        {
            ...extDefaults(),
            name: '@vendor/magento-graphql-foo',
            context: (ctx: any) => {
                ctx.shouldNotStay = true;
                return {};
            },
        },
    ];
    const context = contextBuilder({
        extensions,
        headers: {},
    });

    expect(context).not.toHaveProperty('shouldNotStay');
});

test('Maps Magento core specific headers to top-level of context', () => {
    const context = contextBuilder({
        extensions: [],
        headers: {
            authorization: 'Bearer abcdefg',
            'Content-Currency': 'USD',
            Store: 'storeview',
        },
    });
    expect(context.legacyToken).toBe('Bearer abcdefg');
    expect(context.currency).toBe('USD');
    expect(context.store).toBe('storeview');
});

test("an extension cannot see another extensions' context properties", () => {
    expect.assertions(2);

    const extensions = [
        {
            ...extDefaults(),
            name: '@vendor/magento-graphql-foo',
            context: (ctx: any) => {
                expect(ctx).not.toHaveProperty('bar');
                return {};
            },
        },
        {
            ...extDefaults(),
            name: '@vendor/magento-graphql-foo',
            context: (ctx: any) => {
                expect(ctx).not.toHaveProperty('foo');
                return {};
            },
        },
    ];

    contextBuilder({ extensions, headers: {} });
});
