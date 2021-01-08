/**
 * TODO: TEMPORARY solution to test requests to gRPC from test GraphQL query (should be fixed in SFAPP-227)
 */
import gql from 'graphql-tag';

export const typeDefs = gql`
    extend type Query {
        getProductsByIds(ids: [ID]!): Products
    }
`;
