/* eslint-disable no-process-env */

/**
 * @summary All configuration values that can be supplied to the application
 */
const frameworkConfig = {
    HOST: {
        docs: 'Host for the GraphQL server to listen on',
        default: '0.0.0.0',
    },
    PORT: {
        docs: 'Port for GraphQL server to listen on',
        default: 8008,
    },
    LEGACY_GRAPHQL_URL: {
        docs:
            'Absolute URL of Magento Core GraphQL endpoint. Used to proxy requests for parts of the schema not yet implemented',
        default: 'https://store.test/graphql',
    },
    PREMIUM_SEARCH_GRAPHQL_URL: {
        docs: 'Absolute URL of Premium Search GraphQL endpoint',
        default: 'https://search-host.test/graphql',
    },
    PREMIUM_SEARCH_API_KEY: {
        docs: 'Key passed to Premium Search using "X-API-KEY" header',
        default: 'api-key',
    },
    ENABLE_PREMIUM_SEARCH: {
        docs: 'Enables the Magento Premium Search integration',
        default: 'false',
    },
    UNSUPPORTED_APOLLO_SERVER: {
        docs:
            'Use apollo-server-fastify instead of fastify-gql. Mainly used to validate our early performance research',
        default: 'false',
    },
};

export function getFrameworkConfig() {
    return new ConfigReader(frameworkConfig);
}

/**
 * @summary Constructs a type-safe configuration reader that
 *          reads values from environment variables.
 */
export class ConfigReader<TConfigNames extends string> {
    constructor(private config: ConfigDefs<TConfigNames>) {}

    get(key: TConfigNames) {
        const value = this.has(key)
            ? process.env[key]
            : this.config[key].default;
        return new ConfigValueWrapper(key, value);
    }

    has(key: TConfigNames) {
        return Object.prototype.hasOwnProperty.call(process.env, key);
    }

    describe(key: TConfigNames) {
        return this.config[key].docs;
    }

    keys() {
        return Object.keys(this.config) as TConfigNames[];
    }
}

class ConfigValueWrapper {
    constructor(private key: string, private value: unknown) {}

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
export type ConfigDefs<K extends string> = Record<K, ConfigDescriptor>;
