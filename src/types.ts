import { DataSource } from 'apollo-datasource';

export type GraphQLContext<
    DataSources extends Record<string, DataSource> = {}
> = {
    legacyToken?: string;
    currency?: string;
    store?: string;
    dataSources: DataSources;
};
