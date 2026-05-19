"use client";

import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  getCountryDefaultTimeZone,
  getCountryTimeZones,
  normalizeCountryCode,
  normalizePhoneNumber
} from "@hr-app/geo";
import { Building2, Globe2, Save, UserRound } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { PageHeader } from "@/components/app-shell/page-header";
import { ErrorState } from "@/components/data-display/error-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { OrganizationCatalogPanel } from "@/features/organization/components/organization-catalog-panel";
import { OrganizationUnitTypesPanel } from "@/features/organization/components/organization-unit-types-panel";
import { OrganizationUnitsPanel } from "@/features/organization/components/organization-units-panel";
import { organizationCatalogByKind } from "@/features/organization/organization-config";
import { CountrySelect } from "@/features/geo/components/country-select";
import { PhoneInput } from "@/features/geo/components/phone-input";
import { TimezoneSelect } from "@/features/timezones/components/timezone-select";
import { useCurrentTenant } from "@/hooks/use-current-tenant";
import { cn } from "@/lib/utils";
import { useAppDispatch } from "@/store/hooks";
import { DEFAULT_TIME_ZONE } from "@hr-app/timezones";
import {
  companySettingsSchema,
  type CompanySettingsFormValues
} from "../company-settings-schema";
import { useGetCurrentTenantQuery, useUpdateCurrentTenantMutation } from "../tenants-api";
import { updateCurrentTenantName } from "../tenant-slice";

const currencyOptions = [
  { label: "Boliviano (BOB)", value: "BOB" },
  { label: "US Dollar (USD)", value: "USD" }
] as const;

const companySizeOptions = [
  { label: "Select size", value: "" },
  { label: "1-10", value: "1-10" },
  { label: "11-50", value: "11-50" },
  { label: "51-200", value: "51-200" },
  { label: "201-500", value: "201-500" },
  { label: "501-1000", value: "501-1000" },
  { label: "1000+", value: "1000+" }
] as const;
type CompanySizeFormValue = (typeof companySizeOptions)[number]["value"];
const companySizeValues = new Set<string>(companySizeOptions.map((option) => option.value));
const toCompanySizeFormValue = (value: string | null | undefined): CompanySizeFormValue =>
  value && companySizeValues.has(value) ? (value as CompanySizeFormValue) : "";
const toTimezoneFormValue = (country: string | null | undefined, timezone: string): string => {
  if (!country) {
    return timezone;
  }

  const countryTimeZones = getCountryTimeZones(country);

  if (countryTimeZones.some((timeZone) => timeZone === timezone)) {
    return timezone;
  }

  return getCountryDefaultTimeZone(country) ?? timezone;
};

const companySettingsTabs = [
  { key: "profile", label: "Profile" },
  { key: "locations", label: "Locations" },
  { key: "structure", label: "Structure" }
] as const;

type CompanySettingsTab = (typeof companySettingsTabs)[number]["key"];

export function CompanySettingsPage() {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<CompanySettingsTab>("profile");
  const currentTenant = useCurrentTenant();
  const tenantSlug = currentTenant.tenantSlug;
  const { data: tenant, isError, isFetching } = useGetCurrentTenantQuery(tenantSlug, {
    skip: !tenantSlug
  });
  const [updateTenant, updateState] = useUpdateCurrentTenantMutation();
  const showInitialSkeleton = isFetching && !tenant;

  const {
    formState: { errors, isDirty },
    control,
    handleSubmit,
    register,
    reset,
    setValue,
    watch
  } = useForm<CompanySettingsFormValues>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: {
      name: "",
      defaultLanguage: "en",
      defaultCurrency: "BOB",
      timezone: DEFAULT_TIME_ZONE,
      website: "",
      companySize: "",
      country: "",
      phone: ""
    }
  });
  const selectedCountry = watch("country");
  const selectedTimezone = watch("timezone");

  useEffect(() => {
    if (!tenant) {
      return;
    }

    reset({
      name: tenant.name,
      defaultLanguage: "en",
      defaultCurrency: tenant.defaultCurrency === "USD" ? "USD" : "BOB",
      timezone: toTimezoneFormValue(tenant.profile?.country, tenant.timezone),
      website: tenant.profile?.website ?? "",
      companySize: toCompanySizeFormValue(tenant.profile?.companySize),
      country: tenant.profile?.country ?? "",
      phone: tenant.profile?.phone ?? ""
    });
  }, [reset, tenant]);

  useEffect(() => {
    if (!selectedCountry) {
      return;
    }

    const countryTimeZones = getCountryTimeZones(selectedCountry);

    if (selectedTimezone && countryTimeZones.some((timeZone) => timeZone === selectedTimezone)) {
      return;
    }

    const defaultTimeZone = getCountryDefaultTimeZone(selectedCountry);

    if (defaultTimeZone) {
      setValue("timezone", defaultTimeZone, { shouldDirty: true, shouldValidate: true });
    }
  }, [selectedCountry, selectedTimezone, setValue]);

  const onSubmit: SubmitHandler<CompanySettingsFormValues> = async (values) => {
    const country = normalizeCountryCode(values.country);
    const phone = normalizePhoneNumber(values.phone, country);

    try {
      const updatedTenant = await updateTenant({
        tenantSlug,
        name: values.name,
        defaultLanguage: "en",
        defaultCurrency: values.defaultCurrency,
        timezone: values.timezone,
        profile: {
          website: values.website.trim() || null,
          companySize: values.companySize || null,
          country: country ?? null,
          phone: phone ?? null
        }
      }).unwrap();
      dispatch(updateCurrentTenantName(updatedTenant.name));
      reset({
        name: updatedTenant.name,
        defaultLanguage: "en",
        defaultCurrency: updatedTenant.defaultCurrency === "USD" ? "USD" : "BOB",
        timezone: toTimezoneFormValue(updatedTenant.profile?.country, updatedTenant.timezone),
        website: updatedTenant.profile?.website ?? "",
        companySize: toCompanySizeFormValue(updatedTenant.profile?.companySize),
        country: updatedTenant.profile?.country ?? "",
        phone: updatedTenant.profile?.phone ?? ""
      });
      showToast({ title: "Company settings saved", tone: "success" });
    } catch {
      showToast({
        title: "Company settings could not be saved",
        description: "Review the values and try again.",
        tone: "error"
      });
    }
  };

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Settings", href: "/settings" },
          { label: "Company settings" }
        ]}
        title="Company settings"
        description="Manage company profile, operating locations, and organizational structure."
      />

      <div className="flex flex-wrap gap-2 border-b border-border">
        {companySettingsTabs.map((tab) => (
          <button
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {activeTab === "profile" ? (
          <>
            {isError ? <ErrorState title="Company settings could not load" /> : null}

            <form className="grid gap-5 xl:grid-cols-[1fr_22rem]" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-5">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" aria-hidden="true" />
                      Company identity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {showInitialSkeleton ? (
                      <CompanyIdentitySkeleton />
                    ) : (
                      <>
                        <label className="block">
                          <span className="text-sm font-medium">
                            Company name
                            <RequiredMark />
                          </span>
                          <Input className="mt-1" disabled={!tenant} placeholder="AssureSoft Demo" {...register("name")} />
                          {errors.name ? <span className="mt-1 block text-sm text-rose-600">{errors.name.message}</span> : null}
                        </label>

                        <label className="block">
                          <span className="text-sm font-medium">Workspace slug</span>
                          <Input
                            className="mt-1 cursor-not-allowed border-border/70 bg-muted text-muted-foreground opacity-80"
                            disabled
                            value={tenant?.slug ?? ""}
                          />
                          <span className="mt-1 block text-xs text-muted-foreground">Slug changes are disabled for now.</span>
                        </label>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserRound className="h-4 w-4" aria-hidden="true" />
                      Company profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    {showInitialSkeleton ? (
                      <CompanyProfileSkeleton />
                    ) : (
                      <>
                        <label className="block">
                          <span className="text-sm font-medium">Website</span>
                          <Input className="mt-1" disabled={!tenant} placeholder="example.com" {...register("website")} />
                          {errors.website ? (
                            <span className="mt-1 block text-sm text-rose-600">{errors.website.message}</span>
                          ) : null}
                        </label>

                        <label className="block">
                          <span className="text-sm font-medium">Company size</span>
                          <select
                            className="mt-1 h-9 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
                            disabled={!tenant}
                            {...register("companySize")}
                          >
                            {companySizeOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          {errors.companySize ? (
                            <span className="mt-1 block text-sm text-rose-600">{errors.companySize.message}</span>
                          ) : null}
                        </label>

                        <label className="block">
                          <span className="text-sm font-medium">Country</span>
                          <CountrySelect className="mt-1" disabled={!tenant} includeEmptyOption {...register("country")} />
                          {errors.country ? (
                            <span className="mt-1 block text-sm text-rose-600">{errors.country.message}</span>
                          ) : null}
                        </label>

                        <label className="block">
                          <span className="text-sm font-medium">Phone</span>
                          <Controller
                            control={control}
                            name="phone"
                            render={({ field }) => (
                              <PhoneInput
                                className="mt-1"
                                countryCode={selectedCountry}
                                disabled={!tenant}
                                {...field}
                              />
                            )}
                          />
                          {errors.phone ? (
                            <span className="mt-1 block text-sm text-rose-600">{errors.phone.message}</span>
                          ) : null}
                        </label>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe2 className="h-4 w-4" aria-hidden="true" />
                      Localization
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    {showInitialSkeleton ? (
                      <LocalizationSkeleton />
                    ) : (
                      <>
                        <input type="hidden" value="en" {...register("defaultLanguage")} />

                        <label className="block">
                          <span className="text-sm font-medium">
                            Default currency
                            <RequiredMark />
                          </span>
                          <select
                            className="mt-1 h-9 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
                            disabled={!tenant}
                            {...register("defaultCurrency")}
                          >
                            {currencyOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          {errors.defaultCurrency ? (
                            <span className="mt-1 block text-sm text-rose-600">{errors.defaultCurrency.message}</span>
                          ) : null}
                        </label>

                        <label className="block">
                          <span className="text-sm font-medium">
                            Timezone
                            <RequiredMark />
                          </span>
                          <TimezoneSelect
                            className="mt-1"
                            countryCode={selectedCountry}
                            disabled={!tenant}
                            {...register("timezone")}
                          />
                          {errors.timezone ? (
                            <span className="mt-1 block text-sm text-rose-600">{errors.timezone.message}</span>
                          ) : null}
                        </label>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              <aside className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Defaults</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>These values are tenant-wide defaults for dates, currency display, reports, and future localized flows.</p>
                    <p>Feature-specific policies can override these defaults later when the module supports it.</p>
                  </CardContent>
                </Card>

                <Button className="w-full" disabled={updateState.isLoading || !isDirty || !tenant} type="submit">
                  <Save className="h-4 w-4" aria-hidden="true" />
                  {updateState.isLoading ? "Saving..." : "Save changes"}
                </Button>
              </aside>
            </form>
          </>
        ) : null}

        {activeTab === "locations" ? (
          <OrganizationCatalogPanel catalog={organizationCatalogByKind.location} />
        ) : null}

        {activeTab === "structure" ? (
          <div className="space-y-5">
            <OrganizationUnitTypesPanel />
            <OrganizationUnitsPanel />
          </div>
        ) : null}
      </div>
    </>
  );
}

function CompanyIdentitySkeleton() {
  return (
    <div className="space-y-4">
      <FieldSkeleton />
      <div>
        <FieldSkeleton />
        <Skeleton className="mt-2 h-3 w-48" />
      </div>
    </div>
  );
}

function LocalizationSkeleton() {
  return (
    <>
      <FieldSkeleton />
      <FieldSkeleton />
    </>
  );
}

function CompanyProfileSkeleton() {
  return (
    <>
      <FieldSkeleton />
      <FieldSkeleton />
      <FieldSkeleton />
      <FieldSkeleton />
    </>
  );
}

function RequiredMark() {
  return (
    <span aria-hidden="true" className="ml-1 text-black">
      *
    </span>
  );
}

function FieldSkeleton() {
  return (
    <div>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-2 h-9 w-full" />
    </div>
  );
}
