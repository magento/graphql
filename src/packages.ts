import { promises as fs } from 'fs';
import { join } from 'path';
import { IResolvers } from '../generated/graphql';
import { DocumentNode } from 'graphql';
import { DataSource } from 'apollo-datasource';

export type GQLPackage = {
    name: string;
    typeDefs: DocumentNode;
    resolvers: IResolvers;
    dataSources: () => Record<string, DataSource>;
};

/**
 * @summary Find all Magento GraphQL packages, and get config
 *          from their respective setup functions
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
    const dataSourceFuncs = [];

    for (const pkg of packages) {
        names.push(pkg.name);
        typeDefs.push(pkg.typeDefs);
        resolvers.push(pkg.resolvers);
        dataSourceFuncs.push(pkg.dataSources);
    }

    return {
        names,
        typeDefs,
        resolvers,
        dataSources: mergeDataSourceFuncs(dataSourceFuncs),
    };
}

type DataSourceFuncs<T extends DataSource> = () => Record<string, T>;
/**
 * @summary Unlike most options to the ApolloServer constructor,
 *          it does _not_ take a [] of dataSources fns, so we need
 *          to combine them manually
 */
function mergeDataSourceFuncs<T>(sourceFns: DataSourceFuncs<T>[]) {
    return () => {
        return sourceFns.reduce((acc, fn) => {
            const result = fn();
            Object.assign(acc, result);
            return acc;
        }, {} as Record<string, T>);
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
    const indexPath = join(packagesRoot, dir, 'index');
    try {
        const {
            typeDefs,
            resolvers,
            dataSources,
        } = require(indexPath).setup() as GQLPackage;

        return { name: dir, typeDefs, resolvers, dataSources };
    } catch (err) {
        console.warn(
            `Unexpected directory "${dir}" found in "${packagesRoot}". ` +
                'Make sure your package has an index file that ' +
                'exports the "setup" function',
        );
    }
};

const reservedDirRegex = /^[._]/;
