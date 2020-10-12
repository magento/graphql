import { contextBuilder } from './contextBuilder';
import { buildFrameworkSchema } from './schema';

/**
 * @summary Creates a new executable GraphQL schema and context
 *          function that can be used with any node HTTP library
 */
export async function prepareForServer() {
    const gateway = await buildFrameworkSchema();

    const context = contextBuilder({
        schema: gateway,
        extensions: [],
    });

    return { schema: gateway, context };
}
