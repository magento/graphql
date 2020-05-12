export type ConfigDescriptor = {
    docs: string;
    default?: unknown;
};

export type ConfigDefs<K extends string> = Record<K, ConfigDescriptor>;

export type ConfigReader<TConfigNames extends string> = {
    get(key: TConfigNames): ConfigReaderTypes;
    has(key: TConfigNames): boolean;
};

export type ConfigReaderTypes = {
    asString: () => string;
    asNumber: () => number;
    asBoolean: () => boolean;
    asStringArray: () => string[];
};

/**
 * @summary Constructs a type-safe configuration reader that
 *          reads values from environment variables.
 */
export function createEnvConfigReader<TConfigNames extends string>(
    config: Record<TConfigNames, ConfigDescriptor>,
): ConfigReader<TConfigNames> {
    // Object.prototype.hasOwnProperty in case we get a config created
    // with `Object.create(null)` (yay ES5)
    const hasOwnProp = Object.prototype.hasOwnProperty.bind(config);
    const get = (key: TConfigNames) =>
        process.env.hasOwnProperty(key)
            ? process.env[key]
            : config[key].default;

    return {
        get: (key: TConfigNames) => createCasters(key, get(key)),
        has: (key: TConfigNames) => hasOwnProp(key),
    };
}

/**
 * @summary Casts configuration values to their requested types
 */
export function createCasters(key: string, value: unknown): ConfigReaderTypes {
    const cleanError = <T>(fn: () => T) => () => {
        try {
            return fn();
        } catch (err) {
            throw new Error(`Failed parsing configuration value: "${key}"`);
        }
    };
    return {
        asString: cleanError(() => String(value)),
        asNumber: cleanError(() => Number(value)),
        asBoolean: cleanError(() => !!value),
        asStringArray: cleanError(() =>
            (value as string).split(',').map(s => s.trim()),
        ),
    };
}
