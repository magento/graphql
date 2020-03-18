import variables from './variables.json';

/* eslint-disable no-process-env */

/**
 * @summary Read an environment variable. All variables
 *          must be defined in variables.json. Throws an
 *          exception with a clear message when a variable
 *          has no default value and is not defined
 */
export function readVar(name: keyof typeof variables): string {
    const value = process.env[name];

    if (process.env.hasOwnProperty(name)) {
        return value as string;
    }

    const descriptor = variables[name];

    const hasDefault = descriptor.default !== null;
    if (hasDefault) {
        // process.env vals set outside the process
        // will always be strings, so we cast defaults
        // to remain consistent, in case someone uses
        // a numeric value in variables.json
        return String(descriptor.default);
    }

    throw new Error(
        `Missing required environment variable "${name}"\n` +
            `  - ${name}: ${descriptor.description}`,
    );
}

/**
 * @summary Check if a known environment variable has been defined.
 */
export function isVarDefined(name: keyof typeof variables): Boolean {
    return process.env.hasOwnProperty(name);
}
