import { contextBuilder } from '../contextBuilder';
import { GraphQLSchema } from 'graphql';

const schema = new GraphQLSchema({ query: undefined });

test('Maps Magento core specific headers to top-level of context', () => {
    const buildContext = contextBuilder({
        schema,
    });
    const context = buildContext({
        authorization: 'Bearer abcdefg',
        'Content-Currency': 'USD',
        Store: 'storeview',
    });
    expect(context.monolithToken).toBe('abcdefg');
    expect(context.currency).toBe('USD');
    expect(context.store).toBe('storeview');
});
