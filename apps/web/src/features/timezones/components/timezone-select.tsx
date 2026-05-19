"use client";

import React, { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";
import { getAmericaTimeZoneOptions } from "@hr-app/timezones";
import { getCountryTimeZones } from "@hr-app/geo";
import { cn } from "@/lib/utils";

interface TimezoneSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  readonly countryCode?: string | null;
  readonly includeEmptyOption?: boolean;
}

export const TimezoneSelect = forwardRef<HTMLSelectElement, TimezoneSelectProps>(function TimezoneSelect(
  { className, countryCode, includeEmptyOption = false, ...props },
  ref
) {
  const countryTimeZones = countryCode ? new Set(getCountryTimeZones(countryCode)) : null;
  const options = getAmericaTimeZoneOptions().filter(
    (option) => !countryTimeZones || countryTimeZones.has(option.value)
  );

  return (
    <select
      className={cn(
        "h-9 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15",
        className
      )}
      ref={ref}
      {...props}
    >
      {includeEmptyOption ? <option value="">Select timezone</option> : null}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
});
