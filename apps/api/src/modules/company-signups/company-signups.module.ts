import { Module } from "@nestjs/common";
import { ApproveCompanySignupRequestUseCase } from "./application/use-cases/approve-company-signup-request.use-case";
import { CheckCompanySignupAvailabilityUseCase } from "./application/use-cases/check-company-signup-availability.use-case";
import { CreateCompanySignupRequestUseCase } from "./application/use-cases/create-company-signup-request.use-case";
import { GetCompanySignupRequestUseCase } from "./application/use-cases/get-company-signup-request.use-case";
import { ListCompanySignupRequestsUseCase } from "./application/use-cases/list-company-signup-requests.use-case";
import { RejectCompanySignupRequestUseCase } from "./application/use-cases/reject-company-signup-request.use-case";
import { COMPANY_SIGNUP_REQUESTS_REPOSITORY } from "./domain/ports/company-signup-requests.repository.port";
import { PrismaCompanySignupRequestsRepository } from "./infrastructure/persistence/prisma-company-signup-requests.repository";
import { CompanySignupRequestsController } from "./presentation/controllers/company-signup-requests.controller";
import { PlatformCompanySignupRequestsController } from "./presentation/controllers/platform-company-signup-requests.controller";

@Module({
  controllers: [CompanySignupRequestsController, PlatformCompanySignupRequestsController],
  providers: [
    ApproveCompanySignupRequestUseCase,
    CheckCompanySignupAvailabilityUseCase,
    CreateCompanySignupRequestUseCase,
    GetCompanySignupRequestUseCase,
    ListCompanySignupRequestsUseCase,
    RejectCompanySignupRequestUseCase,
    {
      provide: COMPANY_SIGNUP_REQUESTS_REPOSITORY,
      useClass: PrismaCompanySignupRequestsRepository
    }
  ],
  exports: [COMPANY_SIGNUP_REQUESTS_REPOSITORY]
})
export class CompanySignupsModule {}
