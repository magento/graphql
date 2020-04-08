/**
 * TypeScript 3.7 added support for the `asserts` return modifier
 * on functions, but the @types/node package hasn't been updated yet:
 * https://github.com/DefinitelyTyped/DefinitelyTyped/issues/40415
 *
 * Making our own basic version, but we can remove in the future
 */

/**
 * @summary Asserts that a value is truthy
 */
export function assert(value: unknown, msg: string): asserts value {
    if (!value) {
        throw new Error(msg);
    }
}
