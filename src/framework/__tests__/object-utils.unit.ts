import { filterUndefinedEntries } from '../object-utils';

test('filterUndefinedEntries returns new object without undefined vals', () => {
    expect(
        filterUndefinedEntries({
            foo: 'foo',
            bar: undefined,
        }),
    ).toEqual({ foo: 'foo' });
});
