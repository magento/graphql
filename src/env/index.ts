import variables from './variables.json';

/**
 * @summary Read an environment variable. All variables
 *          must be defined in variables.json
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
