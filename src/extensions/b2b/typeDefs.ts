import gql from 'graphql-tag';

export const typeDefs = gql`
    extend type Query {
        company: Company
    }
    type Company {
        id: ID!
        name: String
        email: String
        legal_name: String
        vat_id: String
        reseller_id: String
        legal_address: CompanyLegalAddress
        # TODO: Stitching with core where the 'Customer' type is defined
        # company_admin: Customer!
        sales_representative: CompanySalesRepresentative
        # No REST API support for payment_methods
        payment_methods: [String]

        # users cannot be implemented with the current
        # REST APIs because we can't search on custom
        # attributes
        # users(
        #     filter: CompanyUsersFilterInput
        #     pageSize: Int = 20
        #     currentPage: Int = 1
        # ): CompanyUsers

        # TODO: Stitching with core where 'Customer' type is defined
        # user(id: ID): Customer

        # TODO: Add default args back to roles.
        # Default args currently break our toolchain.
        # See https://github.com/ardatan/graphql-tools/issues/1399
        roles(pageSize: Int!, currentPage: Int!): CompanyRoles
        role(id: ID!): CompanyRole
        acl_resources: [CompanyAclResource]
        hierarchy: CompanyHierarchyOutput
        team(id: ID!): CompanyTeam
    }
    type CompanyLegalAddress {
        street: [String]
        city: String

        # Can't do region/country_code until stitching is done
        # region: CustomerAddressRegion!
        # country_code: CountryCodeEnum!
        postcode: String
        telephone: String
    }
    type CompanyAdmin {
        id: ID!
        email: String
        firstname: String
        lastname: String
        job_title: String
        gender: Int
    }
    type CompanySalesRepresentative {
        email: String
        firstname: String
        lastname: String
    }

    # Can't implement until stitching with core is implemented
    # type CompanyUsers {
    #     items: [Customer]
    #     total_count: Int
    #     page_info: SearchResultPageInfo
    # }
    type CompanyRoles {
        items: [CompanyRole]
        total_count: Int

        # Waiting on stitching
        # page_info: SearchResultPageInfo
    }
    type CompanyRole {
        id: ID!
        name: String

        # users_count isn't available in any way
        # using the REST API
        # users_count: Int
        permissions: [String]
    }

    # We can't implement 'sortOrder' or 'children' yet
    # because the REST API doesn't provide sortOrder or
    # parent/child IDs
    type CompanyAclResource {
        id: ID!
        text: String
        sortOrder: Int
        children: [CompanyAclResource!]
    }

    type CompanyHierarchyOutput {
        structure: CompanyHierarchyElement
        isEditable: Boolean
        max_nesting: Int
    }
    type CompanyHierarchyElement {
        id: ID!
        tree_id: ID
        type: String
        text: String
        description: String
        children: [CompanyHierarchyElement!]
    }
    type CompanyTeam {
        id: ID!
        name: String
        description: String
    }
    input CompanyUsersFilterInput {
        status: CompanyUserStatusEnum
    }
    enum CompanyUserStatusEnum {
        ACTIVE
        INACTIVE
    }
`;
