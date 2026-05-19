"use client";

import React, { forwardRef } from "react";
import { useEffect, useState } from "react";
import type { ChangeEvent, InputHTMLAttributes } from "react";
import {
  DEFAULT_COUNTRY_CODE,
  getCallingCodeOptions,
  getCountryDefaultCallingCode,
  normalizePhoneNumber,
  type CallingCode
} from "@hr-app/geo";
import { cn } from "@/lib/utils";

interface PhoneInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  readonly countryCode?: string | null;
  readonly onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly value?: string | null;
}

const callingCodeOptions = getCallingCodeOptions();

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(function PhoneInput(
  { className, countryCode, name, onBlur, onChange, value, ...props },
  ref
) {
  const currentValue = value ?? "";
  const [hasManualCallingCode, setHasManualCallingCode] = useState(false);
  const [selectedCallingCode, setSelectedCallingCode] = useState<CallingCode>(
    getSelectedCallingCode(currentValue, countryCode)
  );
  const localNumber = getLocalNumber(currentValue, selectedCallingCode);

  useEffect(() => {
    const valueCallingCode = getValueCallingCode(currentValue);

    if (valueCallingCode) {
      setSelectedCallingCode(valueCallingCode);
      return;
    }

    if (!hasManualCallingCode) {
      setSelectedCallingCode(
        getCountryDefaultCallingCode(countryCode) ??
          callingCodeOptions[0]?.value ??
          getCountryDefaultCallingCode(DEFAULT_COUNTRY_CODE) ??
          "+1"
      );
    }
  }, [countryCode, currentValue, hasManualCallingCode]);

  const updatePhoneValue = (nextCallingCode: CallingCode, nextLocalNumber: string) => {
    const digits = nextLocalNumber.replace(/\D/g, "");
    const nextValue = digits ? `${nextCallingCode}${digits}` : "";

    onChange({
      target: { name, value: nextValue },
      currentTarget: { name, value: nextValue }
    } as ChangeEvent<HTMLInputElement>);
  };

  return (
    <div className={cn("grid grid-cols-[7.5rem_1fr] gap-2", className)}>
      <select
        aria-label="Phone country code"
        className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
        onChange={(event) => {
          const nextCallingCode = event.target.value as CallingCode;
          setHasManualCallingCode(true);
          setSelectedCallingCode(nextCallingCode);
          updatePhoneValue(nextCallingCode, localNumber);
        }}
        value={selectedCallingCode}
      >
        {callingCodeOptions.map((option) => (
          <option key={`${option.label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <input
        aria-label="Phone number"
        autoComplete="tel-national"
        className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15"
        inputMode="tel"
        name={name}
        onBlur={onBlur}
        onChange={(event) => updatePhoneValue(selectedCallingCode, event.target.value)}
        placeholder="70000000"
        ref={ref}
        value={localNumber}
        {...props}
      />
    </div>
  );
});

const getSelectedCallingCode = (value: string, countryCode: string | null | undefined): CallingCode =>
  getValueCallingCode(value) ??
  getCountryDefaultCallingCode(countryCode) ??
  callingCodeOptions[0]?.value ??
  getCountryDefaultCallingCode(DEFAULT_COUNTRY_CODE) ??
  "+1";

const getValueCallingCode = (value: string): CallingCode | undefined =>
  callingCodeOptions.find((option) => value.startsWith(option.value))?.value;

const getLocalNumber = (value: string, callingCode: CallingCode): string => {
  const normalized = normalizePhoneNumber(value);

  if (!normalized) {
    return value.replace(/\D/g, "");
  }

  return normalized.startsWith(callingCode) ? normalized.slice(callingCode.length) : normalized.slice(1);
};
