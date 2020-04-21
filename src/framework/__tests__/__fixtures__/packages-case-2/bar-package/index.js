const gql = require('graphql-tag');

module.exports = {
    setup(api) {
        api.addTypeDefs(gql`
            type Query {
                hello: String
            }
        `);

        api.addResolvers({
            Query: {
                hello: () => 'a string',
            },
        });
    },
};
