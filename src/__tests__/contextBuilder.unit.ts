import { contextBuilder } from '../contextBuilder';

test('Namespaces extensions to context', () => {
    const extensions = {
        foo: {
            name: 'foo',
            typeDefs: [],
            resolvers: {},
            context: () => ({ testProp: true }),
        },
    };
    const context = contextBuilder({
        extensions,
        headers: {},
    });

    expect(context).toHaveProperty('foo.testProp');
});

test('Does not persist mutations of context obj passed to extension', () => {
    const extensions = {
        foo: {
            name: 'foo',
            typeDefs: [],
            resolvers: {},
            context: (ctx: any) => {
                ctx.shouldNotStay = true;
                return {};
            },
        },
    };
    const context = contextBuilder({
        extensions,
        headers: {},
    });

    expect(context).not.toHaveProperty('shouldNotStay');
});

test('Maps Magento core specific headers to top-level of context', () => {
    const context = contextBuilder({
        extensions: {},
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

test("an extension cannot see another extension's context properties", () => {
    expect.assertions(2);

    const extensions = {
        foo: {
            name: 'foo',
            typeDefs: [],
            resolvers: {},
            context: (ctx: any) => {
                expect(ctx).not.toHaveProperty('bar');
                return {};
            },
        },
        bar: {
            name: 'bar',
            typeDefs: [],
            resolvers: {},
            context: (ctx: any) => {
                expect(ctx).not.toHaveProperty('foo');
                return {};
            },
        },
    };

    contextBuilder({ extensions, headers: {} });
});
