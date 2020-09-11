import gql from 'graphql-tag';
import { createMonolithExecutor } from '../monolith-executor';
import { Response } from 'node-fetch';

const fetchJSONStub = (res: string) =>
    jest.fn().mockImplementation(async () => new Response(res));

const SAMPLE_QUERY = gql`
    query {
        test
    }
`;

test('executor sends requests to correct url', async () => {
    const fetchStub = fetchJSONStub('{}');
    const executor = createMonolithExecutor(
        'https://www.foo.test/graphql',
        fetchStub,
    );
    await executor({ document: SAMPLE_QUERY });
    const [url] = fetchStub.mock.calls[0];
    expect(url).toEqual('https://www.foo.test/graphql');
});

test('executor passes monolith-specific headers from context', async () => {
    const fetchStub = fetchJSONStub('{}');
    const executor = createMonolithExecutor(
        'https://www.foo.test/graphql',
        fetchStub,
    );
    await executor({
        document: SAMPLE_QUERY,
        context: {
            legacyToken: 'token123',
            currency: 'USD',
            store: '1',
        },
    });
    const [, fetchOpts] = fetchStub.mock.calls[0];
    expect(fetchOpts.headers).toMatchObject({
        Authorization: 'Bearer token123',
        'Content-Currency': 'USD',
        Store: '1',
    });
});

test('executor skips monolith-specific headers when context not provided', async () => {
    const fetchStub = fetchJSONStub('{}');
    const executor = createMonolithExecutor(
        'https://www.foo.test/graphql',
        fetchStub,
    );
    await executor({
        document: SAMPLE_QUERY,
    });
    const [, fetchOpts] = fetchStub.mock.calls[0];
    const headers = Object.keys(fetchOpts.headers);
    expect(headers).not.toContain('Authorization');
    expect(headers).not.toContain('Content-Currency');
    expect(headers).not.toContain('Store');
});

test('executor excludes undefined and missing monolith-specific header values', async () => {
    const fetchStub = fetchJSONStub('{}');
    const executor = createMonolithExecutor(
        'https://www.foo.test/graphql',
        fetchStub,
    );
    await executor({
        document: SAMPLE_QUERY,
        context: {
            legacyToken: 'token123',
            store: undefined,
            // excluded currency field
        },
    });
    const [, fetchOpts] = fetchStub.mock.calls[0];
    const headers = Object.keys(fetchOpts.headers);
    expect(headers).toContain('Authorization');
    expect(headers).not.toContain('Content-Currency');
    expect(headers).not.toContain('Store');
});
