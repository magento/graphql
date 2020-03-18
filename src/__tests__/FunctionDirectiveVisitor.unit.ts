import {
    visit,
    ASTNode,
    DirectiveNode,
    StringValueNode,
    ArgumentNode,
} from 'graphql';
import gql from 'graphql-tag';
import { makeExecutableSchema } from 'graphql-tools';
import {
    prependPkgNameToFunctionDirectives,
    FunctionDirectiveVisitor,
} from '../FunctionDirectiveVisitor';

type StringArgumentNode = ArgumentNode & { value: StringValueNode };

const findDirectiveByName = (schema: ASTNode, name: string) => {
    let foundNodes: DirectiveNode[] = [];
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
    const [firstArg] = findDirectiveByName(result, 'function')[0]
        .arguments as StringArgumentNode[];
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
    const [firstFooArg] = fooDir.arguments as StringArgumentNode[];
    const [firstBarArg] = barDir.arguments as StringArgumentNode[];

    expect(firstFooArg.value.value).toBe('foopkg/foo-func');
    expect(firstBarArg.value.value).toBe('foopkg/bar-func');
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
    const [somethingFirstArg] = somethingDir.arguments as StringArgumentNode[];
    expect(somethingFirstArg.value.value).toBe('asdf');
});

test('prependPkgNameToFunctionDirectives throws when missing name param', () => {
    const schema = gql`
        type Query {
            foo: String @function
        }
    `;
    // @ts-ignore Checking for 3rd parties who don't use TypeScript
    const fn = () => prependPkgNameToFunctionDirectives(schema);
    expect(fn).toThrow(/expected 1 argument to @function/i);
});

test('prependPkgNameToFunctionDirectives throws with too many params', () => {
    const schema = gql`
        type Query {
            foo: String @function(name: "func", extra: "anything")
        }
    `;
    // @ts-ignore Checking for 3rd parties who don't use TypeScript
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
    // @ts-ignore
    const fields = executableSchema.getType('Query').getFields();
    expect(typeof fields.foo.resolve).toBe('function');
});
