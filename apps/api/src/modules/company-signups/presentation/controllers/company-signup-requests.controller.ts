import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../../../../common/decorators/public.decorator";
import { SkipTenant } from "../../../../common/decorators/skip-tenant.decorator";
import { CheckCompanySignupAvailabilityUseCase } from "../../application/use-cases/check-company-signup-availability.use-case";
import { CreateCompanySignupRequestUseCase } from "../../application/use-cases/create-company-signup-request.use-case";
import {
  AvailabilityQueryDto,
  CreateCompanySignupRequestDto
} from "../dto/company-signup-request.dto";

@ApiTags("company-signup-requests")
@Public()
@SkipTenant()
@Controller("company-signup-requests")
export class CompanySignupRequestsController {
  constructor(
    private readonly createCompanySignupRequestUseCase: CreateCompanySignupRequestUseCase,
    private readonly checkCompanySignupAvailabilityUseCase: CheckCompanySignupAvailabilityUseCase
  ) {}

  @Post()
  async create(@Body() body: CreateCompanySignupRequestDto) {
    const request = await this.createCompanySignupRequestUseCase.execute(body);

    return {
      id: request.id,
      status: request.status,
      companyName: request.companyName,
      desiredTenantSlug: request.desiredTenantSlug,
      adminEmail: request.adminEmail,
      createdAt: request.createdAt
    };
  }

  @Get("availability/tenant-slug")
  async checkTenantSlug(@Query() query: AvailabilityQueryDto) {
    return this.checkCompanySignupAvailabilityUseCase.checkTenantSlug(query.value);
  }

  @Get("availability/admin-email")
  async checkAdminEmail(@Query() query: AvailabilityQueryDto) {
    return this.checkCompanySignupAvailabilityUseCase.checkAdminEmail(query.value);
  }

  @Get("availability/company-website")
  async checkCompanyWebsite(@Query() query: AvailabilityQueryDto) {
    return this.checkCompanySignupAvailabilityUseCase.checkCompanyWebsite(query.value);
  }
}
