const gql = require('graphql-tag');
const { createExtension } = require('../../../../../api');

module.exports = createExtension({}, (config, api) => {
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
});
