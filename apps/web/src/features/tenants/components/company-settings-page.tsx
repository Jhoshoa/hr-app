"use client";

import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Globe2, Save } from "lucide-react";
import { useForm } from "react-hook-form";
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
import { useCurrentTenant } from "@/hooks/use-current-tenant";
import { cn } from "@/lib/utils";
import { useAppDispatch } from "@/store/hooks";
import { companySettingsSchema, type CompanySettingsFormValues } from "../company-settings-schema";
import { useGetCurrentTenantQuery, useUpdateCurrentTenantMutation } from "../tenants-api";
import { updateCurrentTenantName } from "../tenant-slice";

const languageOptions = [
  { label: "Spanish", value: "es" },
  { label: "English", value: "en" }
] as const;

const currencyOptions = [
  { label: "Boliviano (BOB)", value: "BOB" },
  { label: "US Dollar (USD)", value: "USD" }
] as const;

const timezoneOptions = [
  "America/La_Paz",
  "America/New_York",
  "America/Los_Angeles",
  "America/Mexico_City",
  "America/Bogota",
  "America/Lima",
  "UTC"
] as const;

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
    handleSubmit,
    register,
    reset
  } = useForm<CompanySettingsFormValues>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: {
      name: "",
      defaultLanguage: "es",
      defaultCurrency: "BOB",
      timezone: "America/La_Paz"
    }
  });

  useEffect(() => {
    if (!tenant) {
      return;
    }

    reset({
      name: tenant.name,
      defaultLanguage: tenant.defaultLanguage === "en" ? "en" : "es",
      defaultCurrency: tenant.defaultCurrency === "USD" ? "USD" : "BOB",
      timezone: tenant.timezone
    });
  }, [reset, tenant]);

  const onSubmit = async (values: CompanySettingsFormValues) => {
    try {
      const updatedTenant = await updateTenant({ tenantSlug, ...values }).unwrap();
      dispatch(updateCurrentTenantName(updatedTenant.name));
      reset({
        name: updatedTenant.name,
        defaultLanguage: updatedTenant.defaultLanguage === "en" ? "en" : "es",
        defaultCurrency: updatedTenant.defaultCurrency === "USD" ? "USD" : "BOB",
        timezone: updatedTenant.timezone
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
                          <span className="text-sm font-medium">Company name</span>
                          <Input className="mt-1" disabled={!tenant} placeholder="AssureSoft Demo" {...register("name")} />
                          {errors.name ? <span className="mt-1 block text-sm text-rose-600">{errors.name.message}</span> : null}
                        </label>

                        <label className="block">
                          <span className="text-sm font-medium">Workspace slug</span>
                          <Input className="mt-1" disabled value={tenant?.slug ?? ""} />
                          <span className="mt-1 block text-xs text-muted-foreground">Slug changes are disabled for now.</span>
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
                        <label className="block">
                          <span className="text-sm font-medium">Default language</span>
                          <select
                            className="mt-1 h-9 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
                            disabled={!tenant}
                            {...register("defaultLanguage")}
                          >
                            {languageOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          {errors.defaultLanguage ? (
                            <span className="mt-1 block text-sm text-rose-600">{errors.defaultLanguage.message}</span>
                          ) : null}
                        </label>

                        <label className="block">
                          <span className="text-sm font-medium">Default currency</span>
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

                        <label className="block md:col-span-2">
                          <span className="text-sm font-medium">Timezone</span>
                          <select
                            className="mt-1 h-9 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
                            disabled={!tenant}
                            {...register("timezone")}
                          >
                            {timezoneOptions.map((timezone) => (
                              <option key={timezone} value={timezone}>
                                {timezone}
                              </option>
                            ))}
                          </select>
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
                  {updateState.isLoading ? "Saving..." : "Save settings"}
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
      <div className="md:col-span-2">
        <FieldSkeleton />
      </div>
    </>
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
