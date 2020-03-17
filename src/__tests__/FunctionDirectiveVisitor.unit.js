const { visit } = require('graphql');
const gql = require('graphql-tag');
const { makeExecutableSchema } = require('graphql-tools');
const {
    prependPkgNameToFunctionDirectives,
    FunctionDirectiveVisitor,
} = require('../FunctionDirectiveVisitor');

const findDirectiveByName = (schema, name) => {
    let foundNodes = [];
    visit(schema, {
        Directive(node) {
            if (node.name.value !== name) return;
            foundNodes.push(node);
        },
    });
    return foundNodes;
};

test('prependPkgNameToFunctionDirectives works with 1 @function directive', () => {
    const schema = gql`
        type Query {
            foo: String @function(name: "foo-func")
        }
    `;
    const result = prependPkgNameToFunctionDirectives(schema, 'foopkg');
    const [firstArg] = findDirectiveByName(result, 'function')[0].arguments;
    expect(firstArg.value.value).toBe('foopkg/foo-func');
});

test('prependPkgNameToFunctionDirectives works with 2 @function directives', () => {
    const schema = gql`
        type Query {
            foo: String @function(name: "foo-func")
            bar: Int @function(name: "bar-func")
        }
    `;
    const result = prependPkgNameToFunctionDirectives(schema, 'foopkg');
    const [fooDir, barDir] = findDirectiveByName(result, 'function');
    expect(fooDir.arguments[0].value.value).toBe('foopkg/foo-func');
    expect(barDir.arguments[0].value.value).toBe('foopkg/bar-func');
});

test('prependPkgNameToFunctionDirectives does not modify unrelated directives', () => {
    const schema = gql`
        type Query {
            foo: String @something(value: "asdf")
            bar: Int @another(name: "qwerty")
            car: Int @function(name: "car-func")
        }
    `;
    const result = prependPkgNameToFunctionDirectives(schema, 'foopkg');

    const [somethingDir] = findDirectiveByName(result, 'something');
    expect(somethingDir.arguments[0].value.value).toBe('asdf');
});

test('prependPkgNameToFunctionDirectives throws when missing name param', () => {
    const schema = gql`
        type Query {
            foo: String @function
        }
    `;
    const fn = () => prependPkgNameToFunctionDirectives(schema);
    expect(fn).toThrow(/expected 1 argument to @function/i);
});

test('prependPkgNameToFunctionDirectives throws with too many params', () => {
    const schema = gql`
        type Query {
            foo: String @function(name: "func", extra: "anything")
        }
    `;
    const fn = () => prependPkgNameToFunctionDirectives(schema);
    expect(fn).toThrow(/expected 1 argument to @function/i);
});

test('FunctionDirectiveVisitor attaches resolver to @function directive', () => {
    const schema = gql`
        directive @function(name: String!) on FIELD_DEFINITION
        type Query {
            foo: String @function(name: "foo-func")
        }
    `;
    const executableSchema = makeExecutableSchema({
        typeDefs: schema,
        schemaDirectives: {
            function: FunctionDirectiveVisitor,
        },
    });
    const fields = executableSchema.getType('Query').getFields();
    expect(typeof fields.foo.resolve).toBe('function');
});
