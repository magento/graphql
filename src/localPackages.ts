import { promises as fs } from 'fs';
import { join } from 'path';
import { IResolvers } from '../generated/graphql';
import { DocumentNode } from 'graphql';
import { ContextExtension } from './types';

export type GQLPackage = {
    name: string;
    typeDefs: DocumentNode[];
    resolvers: IResolvers;
    context?: ContextExtension;
};

export type ExtensionAPI = {
    addTypeDefs: (defs: DocumentNode | DocumentNode[]) => ExtensionAPI;
    addResolvers: (resolvers: IResolvers) => ExtensionAPI;
    extendContext: (contextExtension: ContextExtension) => ExtensionAPI;
};

async function invokeExtensionSetup(
    name: string,
    setupFunc: (api: ExtensionAPI) => Promise<void>,
): Promise<GQLPackage> {
    const registration: GQLPackage = {
        name,
        typeDefs: [],
        resolvers: {},
        context: undefined,
    };

    const extensionAPI: ExtensionAPI = {
        addTypeDefs(defs) {
            registration.typeDefs.push(
                ...(Array.isArray(defs) ? defs : [defs]),
            );
            return extensionAPI;
        },
        addResolvers(resolvers) {
            Object.assign(registration.resolvers, resolvers);
            return extensionAPI;
        },
        extendContext(onNewContext) {
            // TODO: Maybe throw an error when an extension tries
            // to extend context > 1 time
            registration.context = onNewContext;
            return extensionAPI;
        },
    };

    await setupFunc(extensionAPI);
    return registration;
}

/**
 * @summary Find all local (in-process) Magento GraphQL packages,
 *          and get config from their respective setup functions
 */
export async function getAllPackages(
    packagesRoot: string,
): Promise<Record<string, GQLPackage>> {
    const subdirs = await fs.readdir(packagesRoot, { withFileTypes: true });
    const pkgs: Record<string, GQLPackage> = {};

    for (const dir of subdirs) {
        if (!dir.isDirectory() || reservedDirRegex.test(dir.name)) {
            continue;
        }

        const pkgConfig = await getPotentialPackage(packagesRoot, dir.name);
        if (pkgConfig) pkgs[pkgConfig.name] = pkgConfig;
    }

    return pkgs;
}

/**
 * @summary Attempt to read a Magento GraphQL package from
 *          a subdir of the packagesRoot.
 */
const getPotentialPackage = async (
    packagesRoot: string,
    dir: string,
): Promise<GQLPackage> => {
    const indexPath = join(packagesRoot, dir);
    let pkg;

    try {
        pkg = require(indexPath);
    } catch (err) {
        console.error(
            `Found extension directory "${indexPath}", but did not find extension within it.`,
        );
        throw err;
    }

    if (typeof pkg.setup !== 'function') {
        throw new Error(
            `Extension is missing setup() function: "${indexPath}"`,
        );
    }

    try {
        return await invokeExtensionSetup(dir, pkg.setup);
    } catch (err) {
        console.error(`Failed running setup() function: ${indexPath}`);
        throw err;
    }
};

const reservedDirRegex = /^[._]/;
