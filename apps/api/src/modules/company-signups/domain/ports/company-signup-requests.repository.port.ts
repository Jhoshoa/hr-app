import type {
  CompanySignupRequestEntity,
  CreateCompanySignupRequestInput,
  ListCompanySignupRequestsInput,
  ListCompanySignupRequestsResult
} from "../entities/company-signup-request.entity";

export const COMPANY_SIGNUP_REQUESTS_REPOSITORY = Symbol("COMPANY_SIGNUP_REQUESTS_REPOSITORY");

export interface CompanySignupRequestsRepository {
  create: (input: CreateCompanySignupRequestInput) => Promise<CompanySignupRequestEntity>;
  list: (input: ListCompanySignupRequestsInput) => Promise<ListCompanySignupRequestsResult>;
  findById: (id: string) => Promise<CompanySignupRequestEntity | null>;
  tenantSlugExists: (slug: string) => Promise<boolean>;
  pendingRequestExistsForSlug: (slug: string) => Promise<boolean>;
  pendingRequestExistsForAdminEmail: (email: string) => Promise<boolean>;
  userExistsByEmail: (email: string) => Promise<boolean>;
  countPendingRequestsForCompanyWebsite: (website: string) => Promise<number>;
}
