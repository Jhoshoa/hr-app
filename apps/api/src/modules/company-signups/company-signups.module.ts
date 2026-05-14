import { Module } from "@nestjs/common";
import { CheckCompanySignupAvailabilityUseCase } from "./application/use-cases/check-company-signup-availability.use-case";
import { CreateCompanySignupRequestUseCase } from "./application/use-cases/create-company-signup-request.use-case";
import { COMPANY_SIGNUP_REQUESTS_REPOSITORY } from "./domain/ports/company-signup-requests.repository.port";
import { PrismaCompanySignupRequestsRepository } from "./infrastructure/persistence/prisma-company-signup-requests.repository";
import { CompanySignupRequestsController } from "./presentation/controllers/company-signup-requests.controller";

@Module({
  controllers: [CompanySignupRequestsController],
  providers: [
    CheckCompanySignupAvailabilityUseCase,
    CreateCompanySignupRequestUseCase,
    {
      provide: COMPANY_SIGNUP_REQUESTS_REPOSITORY,
      useClass: PrismaCompanySignupRequestsRepository
    }
  ],
  exports: [COMPANY_SIGNUP_REQUESTS_REPOSITORY]
})
export class CompanySignupsModule {}
