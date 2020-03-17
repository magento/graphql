import { promises as fs } from 'fs';
import { join } from 'path';
import { IResolvers } from '../generated/graphql';
import { DocumentNode } from 'graphql';

export type GQLPackage = {
    name: string;
    typeDefs: DocumentNode[];
    resolvers: IResolvers;
};

export type ExtensionAPI = {
    addTypeDefs: (defs: DocumentNode | DocumentNode[]) => ExtensionAPI;
    addResolvers: (resolvers: IResolvers) => ExtensionAPI;
};

function invokeExtensionSetup(
    name: string,
    setupFunc: (api: ExtensionAPI) => void,
): GQLPackage {
    const registration = {
        name,
        typeDefs: [] as DocumentNode[],
        resolvers: {} as IResolvers,
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
    };

    setupFunc(extensionAPI);
    return registration;
}

/**
 * @summary Find all local (in-process) Magento GraphQL packages,
 *          and get config from their respective setup functions
 */
export async function getAllPackages(
    packagesRoot: string,
): Promise<GQLPackage[]> {
    const subdirs = await fs.readdir(packagesRoot, { withFileTypes: true });
    const pkgs = [];

    for (const dir of subdirs) {
        if (!dir.isDirectory() || reservedDirRegex.test(dir.name)) {
            continue;
        }

        const pkgConfig = getPotentialPackage(packagesRoot, dir.name);
        if (pkgConfig) pkgs.push(pkgConfig);
    }

    return pkgs;
}

export function mergePackageConfigs(packages: GQLPackage[]) {
    const names = [];
    const typeDefs = [];
    const resolvers = [];

    for (const pkg of packages) {
        names.push(pkg.name);
        typeDefs.push(...pkg.typeDefs);
        resolvers.push(pkg.resolvers);
    }

    return {
        names,
        typeDefs,
        resolvers,
    };
}

/**
 * @summary Attempt to read a Magento GraphQL package from
 *          a subdir of the packages root. Will not throw
 *          on unrecognized dirs, but will instead flush a
 *          warning to stderr
 */
const getPotentialPackage = (
    packagesRoot: string,
    dir: string,
): GQLPackage | undefined => {
    const indexPath = join(packagesRoot, dir);
    let pkg;

    try {
        pkg = require(indexPath);
    } catch (err) {
        console.warn(
            `Found extension directory "${indexPath}", but did not find extension within it.`,
        );
        return;
    }

    if (typeof pkg.setup !== 'function') {
        console.warn(`Extension is missing setup() function: "${indexPath}"`);
        return;
    }

    try {
        return invokeExtensionSetup(dir, pkg.setup);
    } catch (err) {
        console.warn(`Failed running setup() function: ${indexPath}`);
    }
};

const reservedDirRegex = /^[._]/;
