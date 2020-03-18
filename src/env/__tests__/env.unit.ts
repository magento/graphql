/* eslint-disable no-process-env */

import { readVar, hasVar } from '..';

let keysToClean: string[] = [];
const envMock = (dict: Record<string, string>) => {
    keysToClean = Object.keys(dict);
    Object.assign(process.env, dict);
};

afterEach(() => {
    keysToClean.forEach(k => delete process.env[k]);
    keysToClean = [];
});

test('readVar returns default value when one is not specified', () => {
    expect(readVar('PORT').asNumber()).toBe(4000);
});

test('readVar favors process.env over default val', () => {
    envMock({
        PORT: '4001',
    });
    expect(readVar('PORT').asNumber()).toBe(4001);
});

test('can read a value as a string', () => {
    envMock({ IO_API_KEY: 'foobar' });
    expect(readVar('IO_API_KEY').asString()).toBe('foobar');
});

test('can read a comma-separated string as an array', () => {
    envMock({ IO_PACKAGES: 'foo,bar,bizz' });
    expect(readVar('IO_PACKAGES').asArray()).toEqual(['foo', 'bar', 'bizz']);
});

test('hasVar works with properties that have defaults', () => {
    expect(hasVar('PORT')).toBe(true);
});

test('hasVar works with properties that do not have defaults', () => {
    expect(hasVar('IO_API_KEY')).toBe(false);
    envMock({ IO_API_KEY: 'foobar ' });
    expect(hasVar('IO_API_KEY')).toBe(true);
});
