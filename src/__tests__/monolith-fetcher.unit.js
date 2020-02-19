const { gql } = require('apollo-server');
const { createMonolithFetcher } = require('../monolith-fetcher');
const { Response } = require('node-fetch');

const fetchJSONStub = resString =>
    jest.fn().mockImplementation(async () => new Response(resString));

const SAMPLE_QUERY = gql`
    query {
        test
    }
`;

test('fetcher sends requests to correct url', async () => {
    const fetchStub = fetchJSONStub('{}');
    const fetcher = createMonolithFetcher(
        'https://www.foo.test/graphql',
        fetchStub,
    );
    await fetcher({ query: SAMPLE_QUERY });
    const [url] = fetchStub.mock.calls[0];
    expect(url).toEqual('https://www.foo.test/graphql');
});

test('fetcher passes monolith-specific headers from context', async () => {
    const fetchStub = fetchJSONStub('{}');
    const fetcher = createMonolithFetcher(
        'https://www.foo.test/graphql',
        fetchStub,
    );
    await fetcher({
        query: SAMPLE_QUERY,
        context: {
            graphqlContext: {
                legacyToken: 'token123',
                currency: 'USD',
                store: '1',
            },
        },
    });
    const [, fetchOpts] = fetchStub.mock.calls[0];
    expect(fetchOpts.headers).toMatchObject({
        Authorization: 'token123',
        'Content-Currency': 'USD',
        Store: '1',
    });
});

test('fetcher skips monolith-specific headers when context not provided', async () => {
    const fetchStub = fetchJSONStub('{}');
    const fetcher = createMonolithFetcher(
        'https://www.foo.test/graphql',
        fetchStub,
    );
    await fetcher({
        query: SAMPLE_QUERY,
    });
    const [, fetchOpts] = fetchStub.mock.calls[0];
    const headers = Object.keys(fetchOpts.headers);
    expect(headers).not.toContain('Authorization');
    expect(headers).not.toContain('Content-Currency');
    expect(headers).not.toContain('Store');
});
