import assert from 'assert';
import * as t from './rest-types';
import fetch, { Response } from 'node-fetch';
import { URLSearchParams } from 'url';

type B2BAPIClientOpts = {
    fetch?: typeof fetch;
    integrationToken: string;
    customerToken: string;
    hostname: string;
    port: number;
    protocol: 'http:' | 'https:';
    storeCode?: string;
};

/**
 * @summary API Client for interacting with the Magento 2
 *          B2B REST API _on behalf of a store employee_.
 *
 *          Notable:
 *
 *          - The B2B REST API is an _admin_ API, and was not
 *            designed to serve requests on behalf of shoppers.
 *            Because of this, data authorization is implemented
 *            within this client, not within the PHP application.
 *            Authorization is still a TODO while Nishant + Mark
 *            make a mapping of GraphQL fields >> auth roles.
 *
 *          - No support for solving the N+1 problem (dataloader)
 *            is baked in, because collections already come back
 *            via a single GET. The REST API has no support for
 *            multiple queries via a single request
 *
 *          - Requests are deduped via a short-term cache
 *
 *          - The types imported from ./rest-types are _not_ validated
 *            at run-time. A good TODO would be to add some validation
 *            when running in dev mode, or a toggle for use in prod
 */
export class B2BAPIClient {
    private fetch: typeof fetch;
    private storeURL: string;
    /** Very much *not* an RFC-7234 compliant cache */
    private cache: Map<string, Promise<Response>>;
    private tokens: { customerToken: string; integrationToken: string };

    constructor(opts: B2BAPIClientOpts) {
        this.fetch = opts.fetch ?? fetch;
        const storeCode = opts.storeCode ?? 'default';
        this.storeURL = `${opts.protocol}//${opts.hostname}:${opts.port}/rest/${storeCode}/V1`;
        this.tokens = {
            customerToken: opts.customerToken,
            integrationToken: opts.integrationToken,
        };
        // WARNING: Cache lives for the lifetime of a B2BAPIClient
        //          instance, and is only purged when the B2BAPIClient
        //          is GC'd. Leaking these Promise<Response> objects
        //          would wreak havoc on performance.
        this.cache = new Map();
    }

    getLoggedInCustomer() {
        return this.getJSON(
            `/customers/me`,
            this.tokens.customerToken,
        ) as Promise<t.CustomerModel>;
    }

    getCustomer(id: number) {
        return this.getJSON(
            `/customers/${id}`,
            this.tokens.integrationToken,
        ) as Promise<t.CustomerModel>;
    }

    async getCompany() {
        const customer = await this.getLoggedInCustomer();
        const { company_id } = customer.extension_attributes.company_attributes;
        const url = `/company/${company_id}`;
        return this.getJSON(url, this.tokens.integrationToken) as Promise<
            t.CompanyModel
        >;
    }

    async getSalesRep() {
        const company = await this.getCompany();
        return this.getCustomer(company.sales_representative_id);
    }

    async getRoles(opts: { pageSize: number; currentPage: number }) {
        const { id } = await this.getCompany();
        const queryFilter = {
            field: 'company_id',
            value: id,
            condition_type: 'eq',
        };
        const query = restSearchQuery([[queryFilter]], opts);
        const url = `/company/role?${query}`;
        return this.getJSON(url, this.tokens.integrationToken) as Promise<
            t.RolesModel
        >;
    }

    getRole(roleID: number | string) {
        return this.getJSON(
            `/company/role/${roleID}`,
            this.tokens.integrationToken,
        ) as Promise<t.RoleModel>;
    }

    getTeam(teamID: number | string) {
        return this.getJSON(
            `/team/${teamID}`,
            this.tokens.integrationToken,
        ) as Promise<t.TeamModel>;
    }

    /**
     * @summary Save a response for an HTTP GET to the cache.
     */
    private async saveResponseToCache(
        url: string,
        token: string,
        eventualResponse: Promise<Response>,
    ) {
        const cacheKey = this.computeCacheKey(url, token);
        // Need to stash the request synchronously before
        // execution is suspended to prevent race conditions
        // that would lead to cache misses
        this.cache.set(cacheKey, eventualResponse);
        // Can queue async tasks now that cache is set
        try {
            const resp = await eventualResponse;
            return resp.clone();
        } catch (err) {
            // We don't want to keep a cache entry
            // for failed requests
            this.cache.delete(cacheKey);
            throw err;
        }
    }

    /**
     * @summary Obtain the cached Response for an HTTP GET
     */
    private async getResponseFromCache(url: string, token: string) {
        const cacheKey = this.computeCacheKey(url, token);
        const response = this.cache.get(cacheKey);
        if (response) {
            // Don't give out the original response stream
            return (await response).clone();
        }
    }

    private computeCacheKey(url: string, token: string) {
        return `${url}|${token}`;
    }

    private async getJSON(url: string, token: string): Promise<unknown> {
        const cachedResponse = await this.getResponseFromCache(url, token);
        if (cachedResponse) {
            return cachedResponse.json();
        }

        const response = await this.saveResponseToCache(
            url,
            token,
            this.fetch(`${this.storeURL}${url}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }),
        );

        assert(response.status < 500, `Failed connecting to B2B REST API`);
        assert(response.status < 400, 'B2B REST authentication failed');
        return response.json();
    }
}

type RESTFilter = {
    field: string;
    value: string | number;
    condition_type: string;
};
type RESTFilterGroup = RESTFilter[];
type RestSearchOpts = {
    pageSize?: number;
    currentPage?: number;
};
/**
 * @summary Magento's REST API has a verbose query language that's used
 *          to construct a multi-dimensional PHP array on the server-side.
 *          This simplifies usage for us
 */
function restSearchQuery(
    filterGroups: RESTFilterGroup[],
    opts: RestSearchOpts,
) {
    const params = new URLSearchParams();
    for (const [groupsIndex, group] of Object.entries(filterGroups)) {
        for (const [filterIndex, filter] of Object.entries(group)) {
            const prelude = `searchCriteria[filter_groups][${groupsIndex}][filters][${filterIndex}]`;
            params.append(`${prelude}[field]`, filter.field);
            params.append(`${prelude}[value]`, String(filter.value));
            params.append(`${prelude}[condition_type]`, filter.condition_type);
        }
    }

    if (opts.currentPage) {
        params.append('searchCriteria[currentPage]', String(opts.currentPage));
    }

    if (opts.pageSize) {
        params.append('searchCriteria[pageSize]', String(opts.currentPage));
    }

    return params.toString();
}
