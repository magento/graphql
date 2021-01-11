import assert from 'assert';
import { createMonolithExecutor } from './monolith-executor';
import {
    introspectSchema,
    batchDelegateToSchema,
    TransformQuery,
    SubschemaConfig,
} from 'graphql-tools';
import { FrameworkConfig } from '../../config';
import {
    isInputObjectType,
    Kind,
    GraphQLResolveInfo,
    GraphQLSchema,
    SelectionSetNode,
} from 'graphql';
import { Logger } from '../../logger';

type Opts = {
    config: FrameworkConfig;
    logger: Logger;
};

/**
 * @summary Builds pieces needed for a remote schema
 *          that proxies requests back to the Magento
 *          PHP implementation of GraphQL. This is done
 *          to allow a gradual migration off the
 *          monolith GraphQL API.
 *
 *          As new storefront services are written,
 *          their implementations in PHP GraphQL will
 *          be deprecated, and this project will become
 *          the sole owner of the GraphQL schema for Magento
 *          eCommerce APIs.
 *
 *          Note that, at the time of writing, the recommended
 *          way to proxy a schema seems to be with Federation.
 *          Federation requires a 2-way contract: the proxied
 *          GraphQL API (our PHP app) needs to know how to be
 *          federated. Because this proxy is temporary and
 *          changes to Magento core are slow, we're using
 *          a remote schema + stitching for now.
 *
 *          We can and should revisit this decision if stitching
 *          becomes hard to maintain.
 */
export async function createMonolithProxySchema({ config, logger }: Opts) {
    const monolithGraphQLURL = config.get('MONOLITH_GRAPHQL_URL').asString();
    const executor = createMonolithExecutor({ monolithGraphQLURL, logger });
    let schema;

    try {
        logger.info(`Fetching monolith schema from ${monolithGraphQLURL}`);
        schema = await introspectSchema(executor);
    } catch (err) {
        logger.error(
            `Failed introspecting monolith schema from ${monolithGraphQLURL}`,
        );
        throw new Error(
            `Failed introspecting remote Magento schema at "${monolithGraphQLURL}". ` +
                'Make sure that the MONOLITH_GRAPHQL_URL configuration is set to ' +
                'the correct value for your Magento instance',
        );
    }

    const attrFilterInput = schema.getType('ProductAttributeFilterInput');
    assert(
        isInputObjectType(attrFilterInput),
        'Could not find required type "ProductAttributeFilterInput" in PHP application schema. Make sure your Magento store is running version 2.3.4 or later.',
    );

    const attrFilterFields = attrFilterInput.getFields();
    // TODO: This check won't be necessary anymore when this PR lands and we update our delegation:
    // https://github.com/magento/magento2/pull/28316
    assert(
        Object.prototype.hasOwnProperty.call(attrFilterFields, 'sku'),
        'Could not find required field "ProductAttributeFilterInput.sku" in PHP application schema. Make sure your store has the "sku" attribute exposed for filtering: https://devdocs.magento.com/guides/v2.4/graphql/custom-filters.html',
    );

    return {
        schema,
        executor,
        merge: {
            SimpleProduct: {
                // Make sure the `sku` field is always fetched from other services,
                // to ensure we can use it for a lookup in the monolith
                selectionSet: `{ sku }`,
                // Track for caching/deduping based on sku
                key: (obj: { sku: string }) => obj.sku,
                // TODO: This `resolve` function and manual usage of `batchDelegateToSchema`
                //       is a necessary hack right now to allow type-merging to delegate
                //       to root queries that return more than just a single list type.
                //
                //       There should be a cleaner way to support this pattern, and I've logged
                //       a GH issue with graphql-tools looking for a better option
                //       https://github.com/ardatan/graphql-tools/issues/2438
                resolve(
                    _originalResult: any,
                    context: any,
                    info: GraphQLResolveInfo,
                    subschema: GraphQLSchema | SubschemaConfig,
                    selectionSet: SelectionSetNode,
                    key: string | number,
                ) {
                    return batchDelegateToSchema({
                        schema: subschema,
                        operation: 'query',
                        fieldName: 'products',
                        key,
                        // Generate the arguments object for the `Query.products` operation
                        // we will send to the monolith
                        argsFromKeys: (skus: readonly string[]) => ({
                            filter: { sku: { in: skus } },
                        }),
                        selectionSet,
                        context,
                        info,
                        // We've landed here from a merged type resolver - must skip
                        // here or we'll end up in an infinite loop
                        skipTypeMerging: true,
                        transforms: [
                            // The monolith returns the `Products` type from `Query.products`,
                            // but graphql-tools type merging wants `Query.products` to return
                            // just a [ProductInterface]. To work-around this for now, we use
                            // a transform query, and hoist the results of the `Product.items`
                            // field to be the only result from `Query.products`.
                            new TransformQuery({
                                // Look for `Query.products`
                                path: ['products'],
                                queryTransformer: subtree => ({
                                    kind: Kind.SELECTION_SET,
                                    selections: [
                                        {
                                            kind: Kind.FIELD,
                                            name: {
                                                kind: Kind.NAME,
                                                value: 'items',
                                            },
                                            selectionSet: subtree,
                                        },
                                    ],
                                }),
                                resultTransformer(result) {
                                    // Only return the items, not the wrapper
                                    // with paging info
                                    return result?.items || [];
                                },
                            }),
                        ],
                    });
                },
            },
        },
    };
}
