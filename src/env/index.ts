/* eslint-disable no-process-env */

const configDef = {
    PORT: {
        docs: 'Port for GraphQL server to bind to',
        default: 4000,
    },
    ECHO_HOST: {
        docs: 'Hostname or IP of greeting gRPC service',
        default: '0.0.0.0',
    },
    ECHO_PORT: {
        docs: 'Port of greeting gRPC service',
        default: 9001,
    },
    LEGACY_GRAPHQL_URL: {
        docs: 'Absolute URL of Magento Core GraphQL endpoint',
    },
    ADOBE_IO_HOST: {
        docs: 'Hostname or IP of Adobe I/O',
        default: 'adobeioruntime.net',
    },
    ADOBE_IO_NAMESPACE: {
        docs: 'Namespace to query for Adobe I/O extension packages',
        default: 'ecp-ior',
    },
    IO_API_KEY: {
        docs: 'API Key used to authenticate with Adobe I/O Runtime',
    },
    IO_PACKAGES: {
        docs:
            'A comma-delimited list of Adobe I/O GraphQL Extension packages to enable',
    },
};

const getValue = (name: keyof typeof configDef) =>
    process.env.hasOwnProperty(name)
        ? process.env[name]
        : ((configDef[name] as any).default as string | undefined);

/**
 * @summary Read an environment variable in a type-safe manner,
 *          falling back to default values when available
 *
 */
export function readVar(name: keyof typeof configDef) {
    const value = getValue(name);

    if (typeof value === 'undefined') {
        const errMsg = [
            'Missing required environment variable',
            `  Name: ${name}`,
            `  Description: ${configDef[name].docs}`,
        ];
        throw new Error(errMsg.join('\n'));
    }

    return {
        asString: () => String(value),
        asNumber: () => Number(value),
        asBoolean: () => !!value,
        asArray: () => value.split(',').map(s => s.trim()),
    };
}

export const hasVar = (name: keyof typeof configDef) =>
    typeof getValue(name) !== 'undefined';
