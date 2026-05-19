import { Injectable } from "@nestjs/common";
import {
  resolveDisplayTimeZone,
  resolveEmployeeOperationalTimeZone,
  resolveLocationOperationalTimeZone,
  resolveTenantDefaultTimeZone,
  type IanaTimeZone,
  type LocationTimeZoneSource,
  type TenantTimeZoneSource
} from "@hr-app/timezones";

interface EmployeeOperationalTimeZoneSource {
  readonly timezone?: string | null;
  readonly currentLocation?: LocationTimeZoneSource | null;
}

@Injectable()
export class TimezoneResolutionService {
  resolveTenantDefault = (tenant?: TenantTimeZoneSource | null): IanaTimeZone =>
    resolveTenantDefaultTimeZone(tenant);

  resolveLocationOperational = (input: {
    readonly tenant?: TenantTimeZoneSource | null;
    readonly location?: LocationTimeZoneSource | null;
  }): IanaTimeZone => resolveLocationOperationalTimeZone(input);

  resolveEmployeeOperational = (input: {
    readonly tenant?: TenantTimeZoneSource | null;
    readonly employee?: EmployeeOperationalTimeZoneSource | null;
  }): IanaTimeZone => resolveEmployeeOperationalTimeZone(input);

  resolveDisplay = (input: {
    readonly tenant?: TenantTimeZoneSource | null;
    readonly userTimezone?: string | null;
    readonly contextLocation?: LocationTimeZoneSource | null;
  }): IanaTimeZone => resolveDisplayTimeZone(input);
}
