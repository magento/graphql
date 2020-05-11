import * as t from './rest-types';
import * as g from '../../../generated/graphql';

// **Important**
// Every function in this file explicitly assigns
// the result object to a variable prior to being
// returned. This isn't ideal, but it's necessary
// to achieve proper type safety due to TypeScript's
// handling of optional properties and literal inference.
// The explicit type annotations on the variable
// declarations ensure that excess properties (like typos)
// are caught by the type checker.

export const toCompany = (v: t.CompanyModel) => {
    const result: g.Company = {
        id: v.id,
        name: v.company_name,
        email: v.company_email,
        legal_name: v.legal_name,
        vat_id: v.vat_tax_id,
        reseller_id: v.reseller_id,
        legal_address: toLegalAddress(v),
    };
    return result;
};

export const toSalesRep = (v: t.CustomerModel) => {
    const result: g.CompanySalesRepresentative = {
        email: v.email,
        firstname: v.firstname,
        lastname: v.lastname,
    };
    return result;
};

export const toLegalAddress = (v: t.CompanyModel) => {
    const result: g.CompanyLegalAddress = {
        street: v.street,
        city: v.city,
        postcode: v.postcode,
        telephone: v.telephone,
    };
    return result;
};

export const toRole = (v: t.RoleModel) => {
    const result: g.CompanyRole = {
        id: v.id,
        name: v.role_name,
        permissions: v.permissions
            .filter(p => p.permission === 'allow')
            .map(p => p.resource_id),
    };
    return result;
};

export const toRoles = (v: t.RolesModel) => {
    const result: g.CompanyRoles = {
        items: v.items.map(toRole),
        total_count: v.items.length,
    };
    return result;
};

export const toTeam = (v: t.TeamModel) => {
    const result: g.CompanyTeam = {
        id: v.id,
        name: v.name,
        description: v.description,
    };
    return result;
};
