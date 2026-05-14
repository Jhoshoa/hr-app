import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  COMPANY_SIGNUP_REQUESTS_REPOSITORY,
  type CompanySignupRequestsRepository
} from "../../domain/ports/company-signup-requests.repository.port";

@Injectable()
export class GetCompanySignupRequestUseCase {
  constructor(
    @Inject(COMPANY_SIGNUP_REQUESTS_REPOSITORY)
    private readonly companySignupRequestsRepository: CompanySignupRequestsRepository
  ) {}

  execute = async (id: string) => {
    const request = await this.companySignupRequestsRepository.findById(id);

    if (!request) {
      throw new NotFoundException("Company signup request was not found.");
    }

    return request;
  };
}
