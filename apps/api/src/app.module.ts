import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { AppConfigModule } from "./config/app-config.module";
import { PrismaModule } from "./database/prisma/prisma.module";
import { InMemoryEventBusModule } from "./events/event-bus.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { AuthGuard } from "./common/guards/auth.guard";
import { PermissionsGuard } from "./common/guards/permissions.guard";
import { PlatformRolesGuard } from "./common/guards/platform-roles.guard";
import { TenantGuard } from "./common/guards/tenant.guard";
import { AuditModule } from "./modules/audit/audit.module";
import { CompanySignupsModule } from "./modules/company-signups/company-signups.module";
import { EmployeesModule } from "./modules/employees/employees.module";
import { HealthModule } from "./health/health.module";
import { IdentityModule } from "./modules/identity/identity.module";
import { OrganizationModule } from "./modules/organization/organization.module";
import { TenantsModule } from "./modules/tenants/tenants.module";

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    InMemoryEventBusModule,
    AuditModule,
    CompanySignupsModule,
    IdentityModule,
    OrganizationModule,
    EmployeesModule,
    TenantsModule,
    HealthModule
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: TenantGuard },
    { provide: APP_GUARD, useClass: PlatformRolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard }
  ]
})
export class AppModule {}
