import assert from 'assert';
import { frameworkConfig } from './frameworkConfig';

export type FrameworkConfig = ReturnType<typeof getFrameworkConfigFromEnv>;
type ConfigKeys = keyof typeof frameworkConfig;
type ConfigSource = Record<ConfigKeys, unknown>;

export function getFrameworkConfigFromEnv() {
    /* eslint-disable no-process-env */
    return new ConfigReader(frameworkConfig, process.env as ConfigSource);
    /* eslint-enable no-process-env */
}

/**
 * @summary Constructs a type-safe configuration reader that
 *          reads values from environment variables.
 */
export class ConfigReader {
    constructor(
        private configDef: Record<ConfigKeys, ConfigDescriptor>,
        private configSource: ConfigSource,
    ) {}

    get(key: ConfigKeys) {
        const value = this.has(key)
            ? this.configSource[key]
            : this.configDef[key].default;
        return new ConfigValueWrapper(key, value);
    }

    has(key: ConfigKeys) {
        return Object.prototype.hasOwnProperty.call(this.configSource, key);
    }

    describe(key: ConfigKeys) {
        return this.configDef[key].docs;
    }

    defaultValue(key: ConfigKeys) {
        return new ConfigValueWrapper(key, this.configDef[key].default);
    }

    keys() {
        return Object.keys(this.configDef) as ConfigKeys[];
    }
}

class ConfigValueWrapper {
    constructor(private key: string, private value: unknown) {
        assert(
            value !== undefined && value !== null,
            `Expected a value for the configuration key "${key}", but received ${value}`,
        );
    }

    private wrapPossibleError<TReturnType>(fn: () => TReturnType) {
        try {
            return fn();
        } catch {
            throw new Error(`Failed parsing of config value for "${this.key}"`);
        }
    }

    asString() {
        return this.wrapPossibleError(() => String(this.value));
    }

    asNumber() {
        return this.wrapPossibleError(() => Number(this.value));
    }

    asBoolean() {
        return this.wrapPossibleError(() => this.value === 'true');
    }
}

type ConfigDescriptor = {
    docs: string;
    default?: unknown;
};
