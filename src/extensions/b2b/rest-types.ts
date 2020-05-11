export type CustomerModel = {
    id: number;
    email: string;
    firstname: string;
    lastname: string;
    gender: number;
    extension_attributes: {
        company_attributes: {
            customer_id: number;
            company_id: number;
            status: number;
            job_title: string;
        };
    };
};

export type CompanyModel = {
    id: number;
    status: number;
    company_name: string;
    legal_name?: string;
    vat_tax_id?: string;
    reseller_id?: string;
    company_email: string;
    street: string[];
    city: string;
    country_id: string;
    region_ID: string;
    postcode: string;
    telephone: string;
    customer_group_id: string;
    sales_representative_id: number;
    reject_reason: string | null;
    rejected_at: string | null;
    super_user_id: number;
    extension_attributes: Record<string, unknown>;
};

export type CountryModel = {
    id: string;
    full_name_locale: string;
    full_name_english: string;
};

export type RoleModel = {
    id: number;
    role_name: string;
    permissions: {
        id: number;
        role_id: number;
        resource_id: string;
        permission: 'allow' | 'deny';
    }[];
};

export type RolesModel = {
    items: RoleModel[];
};

export type TeamModel = {
    id: number;
    name: string;
    description: string;
};
