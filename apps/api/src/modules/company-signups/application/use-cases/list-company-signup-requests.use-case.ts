import { Inject, Injectable } from "@nestjs/common";
import type { CompanySignupStatus } from "@prisma/client";
import {
  COMPANY_SIGNUP_REQUESTS_REPOSITORY,
  type CompanySignupRequestsRepository
} from "../../domain/ports/company-signup-requests.repository.port";

interface ListCompanySignupRequestsInput {
  readonly status?: CompanySignupStatus;
  readonly search?: string;
  readonly page?: number;
  readonly pageSize?: number;
}

@Injectable()
export class ListCompanySignupRequestsUseCase {
  constructor(
    @Inject(COMPANY_SIGNUP_REQUESTS_REPOSITORY)
    private readonly companySignupRequestsRepository: CompanySignupRequestsRepository
  ) {}

  execute = async (input: ListCompanySignupRequestsInput) =>
    this.companySignupRequestsRepository.list({
      status: input.status,
      search: input.search?.trim() || undefined,
      page: Math.max(1, input.page ?? 1),
      pageSize: Math.min(100, Math.max(1, input.pageSize ?? 20))
    });
}
