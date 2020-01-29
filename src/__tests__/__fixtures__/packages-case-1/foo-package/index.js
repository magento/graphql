const { gql } = require('apollo-server');

module.exports = {
    setup() {
        return {
            typeDefs: gql`
                type Query {
                    hello: String
                }
            `,
            resolvers: {
                Query: {
                    hello: () => 'a string',
                },
            },
            dataSources: () => ({}),
        };
    },
};
