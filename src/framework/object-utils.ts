/**
 * @summary Create a new object based on an existing one,
 *          excluding entries with an undefined value
 */
export const filterUndefinedEntries = <K extends string, V>(
    obj: Record<K, V>,
) => {
    return Object.fromEntries(
        Object.entries(obj).filter(o => o[1] !== undefined),
    );
};
