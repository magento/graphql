import {
    visit,
    ASTNode,
    DirectiveNode,
    StringValueNode,
    ArgumentNode,
    GraphQLObjectType,
} from 'graphql';
import gql from 'graphql-tag';
import { makeExecutableSchema } from 'graphql-tools';
import {
    prependPkgNameToFunctionDirectives,
    FunctionDirectiveVisitor,
} from '../FunctionDirectiveVisitor';
import { invokeRemoteResolver } from '../adobe-io';

jest.mock('../adobe-io', () => ({
    invokeRemoteResolver: jest.fn().mockResolvedValue({ foo: 'bar' }),
}));

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
    // @ts-ignore Breaking types to emulate mistake a 3rd party dev could make without TS
    const fn = () => prependPkgNameToFunctionDirectives(schema);
    expect(fn).toThrow(/expected 1 argument to @function/i);
});

test('prependPkgNameToFunctionDirectives throws with too many params', () => {
    const schema = gql`
        type Query {
            foo: String @function(name: "func", extra: "anything")
        }
    `;
    // @ts-ignore Breaking types to emulate mistake a 3rd party dev could make without TS
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
        // @ts-ignore same as comment below
        schemaDirectives: {
            // @ts-ignore Wrong types in graphql-tools@5.0.0. Logged a bug: https://github.com/Urigo/graphql-tools/issues/1376
            function: FunctionDirectiveVisitor,
        },
    });
    const queryField = executableSchema.getType('Query') as GraphQLObjectType;
    expect(typeof queryField.getFields().foo.resolve).toBe('function');
});

test('Resolver set by FunctionDirectiveVisitor invokes I/O func with resolver info', async () => {
    const schema = gql`
        directive @function(name: String!) on FIELD_DEFINITION
        type Query {
            foo: String @function(name: "foo-func")
        }
    `;
    const executableSchema = makeExecutableSchema({
        typeDefs: schema,
        // @ts-ignore same as comment below
        schemaDirectives: {
            // @ts-ignore Wrong types in graphql-tools@5.0.0.
            // Logged a bug: https://github.com/Urigo/graphql-tools/issues/1376
            function: FunctionDirectiveVisitor,
        },
    });
    const queryField = executableSchema.getType('Query') as GraphQLObjectType;
    // @ts-ignore skipping the unneeded resolve info field in test
    await queryField.getFields().foo.resolve(null, {}, {}, {});
    expect(invokeRemoteResolver).toHaveBeenCalledTimes(1);

    expect(invokeRemoteResolver).toHaveBeenCalledWith(
        expect.objectContaining({
            action: 'foo-func',
            resolverData: expect.objectContaining({
                parent: expect.any(Object),
                args: expect.any(Object),
            }),
        }),
    );
});
