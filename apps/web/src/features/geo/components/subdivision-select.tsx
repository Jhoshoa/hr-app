"use client";

import React, { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";
import { getSubdivisionOptions } from "@hr-app/geo";
import { cn } from "@/lib/utils";

interface SubdivisionSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  readonly countryCode?: string | null;
  readonly includeEmptyOption?: boolean;
}

export const SubdivisionSelect = forwardRef<HTMLSelectElement, SubdivisionSelectProps>(function SubdivisionSelect(
  { className, countryCode, includeEmptyOption = true, ...props },
  ref
) {
  const options = getSubdivisionOptions(countryCode);

  return (
    <select
      className={cn(
        "h-9 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15",
        className
      )}
      ref={ref}
      {...props}
    >
      {includeEmptyOption ? <option value="">Select state / department</option> : null}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
});
