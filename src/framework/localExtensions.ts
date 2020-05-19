import { promises as fs } from 'fs';
import { join } from 'path';
import { IResolvers } from '../../generated/graphql';
import { DocumentNode, GraphQLSchema } from 'graphql';
import { ContextExtension } from '../types';
import { Sorter } from '@hapi/topo';
import { createEnvConfigReader, ConfigReader, ConfigDefs } from './config';

type ExtensionRegistration<TConfigNames extends string> = Readonly<{
    config: ConfigDefs<TConfigNames>;
    setupFn: (
        configReader: ConfigReader<TConfigNames>,
        api: ExtensionAPI,
    ) => void | Promise<void>;
}>;

/**
 * @summary Create the registration for a Magento GraphQL Extension
 */
export function createExtension<TConfigNames extends string>(
    config: ConfigDefs<TConfigNames>,
    setupFn: (
        configReader: ConfigReader<TConfigNames>,
        api: ExtensionAPI,
    ) => void | Promise<void>,
): ExtensionRegistration<TConfigNames> {
    return {
        config,
        setupFn,
    };
}

const extensionNameConvention = /(@[\w-]+\/)*magento-graphql-.+/;
const isGQLExtension = (name: string) => extensionNameConvention.test(name);

type PackageJSON = {
    name: string;
    peerDependencies?: Record<string, string>;
    main?: string;
};

export type LocalGQLExtension = {
    name: string;
    typeDefs: DocumentNode[];
    resolvers: IResolvers;
    schemas: GraphQLSchema[];
    context?: ContextExtension;
    deps: string[];
};

export type ExtensionPathResolverResult = {
    path: string;
    packageJSON: PackageJSON;
};

/**
 * @summary Given a collection of root directories to search in,
 *          will discover all directories 1 level deep that are
 *          local Magento GraphQL Extension packages
 */
async function localExtensionPathResolver(
    extensionRoots: string[],
): Promise<ExtensionPathResolverResult[]> {
    const resultsFromRoot = async (root: string) => {
        const subdirs = await fs.readdir(root);
        const potentialExtensions = await Promise.all(
            subdirs.map(dir => readPotentialPackage(join(root, dir))),
        );

        const extensions: ExtensionPathResolverResult[] = [];
        for (const dir of potentialExtensions) {
            if (dir) extensions.push(dir);
        }

        return extensions;
    };

    const readPotentialPackage = async (path: string) => {
        const packageJSON = await safelyReadPackageJSON(path);
        if (packageJSON && isGQLExtension(packageJSON.name)) {
            return { path, packageJSON };
        }
    };

    const rootReads = await Promise.all(extensionRoots.map(resultsFromRoot));
    return rootReads.flat();
}

/**
 * @summary Read and parse a package.json if it exists
 *          in the provided directory.
 */
async function safelyReadPackageJSON(dir: string) {
    const path = join(dir, 'package.json');
    try {
        const raw = await fs.readFile(path, 'utf8');
        return JSON.parse(raw) as PackageJSON;
    } catch {
        return null;
    }
}

/**
 * @summary Aggregate and sort all local GraphQL extensions from
 *          any given number of directories.
 *
 * @todo    Make scoped npm packages (@vendor/foo) work from
 *          node_modules dir (requires extra readdirs)
 */
export async function collectLocalExtensions(
    extensionRoots: string[],
    pathResolver = localExtensionPathResolver,
) {
    const extensionLocations = await pathResolver(extensionRoots);
    const unsortedExtensions = await Promise.all(
        extensionLocations.map(prepareExtension),
    );
    const extensions = sortExtensions(unsortedExtensions);

    const extNames = [];
    const typeDefs = [];
    const resolvers = [];
    const schemas = [];

    for (const ext of extensions) {
        extNames.push(ext.name);
        typeDefs.push(...ext.typeDefs);
        resolvers.push(ext.resolvers);
        schemas.push(...ext.schemas);
    }

    return {
        typeDefs,
        resolvers,
        extensions,
        schemas,
    };
}

/**
 * @summary Perform a topological sort on the list of local
 *          extensions, using each extensions' `peerDependencies`.
 *
 * @todo    Sort alphabetically prior to topologically to make things
 *          deterministic. Right now order is partially dependent on
 *          the output of a readdir system call
 */
function sortExtensions(extensions: LocalGQLExtension[]) {
    const sorter = new Sorter<LocalGQLExtension>();
    for (const ext of extensions) {
        sorter.add(ext, { group: ext.name, after: ext.deps });
    }
    return sorter.nodes;
}

type ExtensionAPI = Readonly<{
    addTypeDefs: (defs: DocumentNode) => ExtensionAPI;
    addResolvers: (resolvers: IResolvers) => ExtensionAPI;
    addSchema: (schema: GraphQLSchema) => ExtensionAPI;
    extendContext: (contextExtension: ContextExtension) => ExtensionAPI;
}>;

async function invokeExtensionSetup<TConfigNames extends string>(
    registration: ExtensionRegistration<TConfigNames>,
) {
    const setupConfig = {
        typeDefs: [] as DocumentNode[],
        resolvers: {} as IResolvers,
        schemas: [] as GraphQLSchema[],
        context: undefined as ContextExtension | undefined,
    };

    const extensionAPI: ExtensionAPI = {
        addTypeDefs(defs) {
            setupConfig.typeDefs.push(defs);
            return extensionAPI;
        },
        addResolvers(resolvers) {
            Object.assign(setupConfig.resolvers, resolvers);
            return extensionAPI;
        },
        addSchema(schema) {
            setupConfig.schemas.push(schema);
            return extensionAPI;
        },
        extendContext(onNewContext) {
            // TODO: Maybe throw an error when an extension tries
            // to extend context > 1 time
            setupConfig.context = onNewContext;
            return extensionAPI;
        },
    };

    const { config, setupFn } = registration;
    // TODO: Would be nice if the config reader factory
    // were configurable to make tests less of a chore
    const configReader = createEnvConfigReader(config);
    await setupFn(configReader, extensionAPI);
    return setupConfig;
}

const prepareExtension = async (opts: {
    packageJSON: PackageJSON;
    path: string;
}): Promise<LocalGQLExtension> => {
    const { packageJSON, path } = opts;
    const entryPoint = join(path, packageJSON.main || '');

    let pkg;

    try {
        pkg = require(entryPoint);
    } catch (err) {
        console.error(
            `Found extension "${packageJSON.name}" at "${path}", but could not determine module entry point`,
        );
        throw err;
    }

    // compat for CommonJS + transpiled ES2015 module
    const defaultExport = pkg.__esModule && pkg.default ? pkg.default : pkg;

    if (!(defaultExport && typeof defaultExport.setupFn === 'function')) {
        throw new Error(
            `An extension did not export any configuration:\n` +
                `  Extension: ${packageJSON.name}\n` +
                `  Entry Point: ${entryPoint}`,
        );
    }

    const registration: ExtensionRegistration<string> = defaultExport;
    let setupConfig;

    try {
        setupConfig = await invokeExtensionSetup(registration);
    } catch (err) {
        // add some context before re-throwing extension's error
        console.error(
            `Failed running extension setup function:\n` +
                `  Extension: ${packageJSON.name}\n` +
                `  Entry Path: ${entryPoint}`,
        );
        throw err;
    }

    return {
        name: packageJSON.name,
        deps: Object.keys(packageJSON.peerDependencies || {}).filter(
            isGQLExtension,
        ),
        ...setupConfig,
    };
};
