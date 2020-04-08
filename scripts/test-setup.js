// ts-jest checks our types in tests, which is a good thing! But,
// our types require code gen. We do this in the setup script
// to ensure test runs are not coupled to artifacts from the
// full build script

module.exports = require('execa').bind(null, 'gql-gen', {
    preferLocal: true,
});
