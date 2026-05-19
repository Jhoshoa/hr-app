"use client";

import React, { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";
import { getCountryOptions } from "@hr-app/geo";
import { cn } from "@/lib/utils";

interface CountrySelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  readonly includeEmptyOption?: boolean;
}

export const CountrySelect = forwardRef<HTMLSelectElement, CountrySelectProps>(function CountrySelect(
  { className, includeEmptyOption = false, ...props },
  ref
) {
  return (
    <select
      className={cn(
        "h-9 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15",
        className
      )}
      ref={ref}
      {...props}
    >
      {includeEmptyOption ? <option value="">Select country</option> : null}
      {getCountryOptions().map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
});
