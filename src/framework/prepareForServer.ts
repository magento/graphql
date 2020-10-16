import { contextBuilder } from './contextBuilder';
import { buildFrameworkSchema } from './schema';

/**
 * @summary Creates a new executable GraphQL schema and context
 *          function that can be used with any node HTTP library
 */
export async function prepareForServer() {
    const schema = await buildFrameworkSchema();
    const context = contextBuilder({ schema });

    return { schema, context };
}
