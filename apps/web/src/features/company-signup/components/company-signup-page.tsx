"use client";

import React, { forwardRef, useEffect, useRef, useState } from "react";
import type { ReactNode, SelectHTMLAttributes } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { getCountryDefaultTimeZone, getCountryTimeZones } from "@hr-app/geo";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CountrySelect } from "@/features/geo/components/country-select";
import { PhoneInput } from "@/features/geo/components/phone-input";
import { TimezoneSelect } from "@/features/timezones/components/timezone-select";
import { useToast } from "@/components/ui/toast";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { loginPath } from "@/lib/auth/auth-redirects";
import {
  useCreateCompanySignupRequestMutation,
  useLazyCheckCompanySignupAdminEmailAvailabilityQuery,
  useLazyCheckCompanySignupTenantSlugAvailabilityQuery,
  useLazyCheckCompanySignupWebsiteAvailabilityQuery
} from "../company-signup-api";
import { getCompanySignupErrorMessage } from "../company-signup-errors";
import {
  canCheckAdminEmailAvailability,
  canCheckCompanyWebsiteAvailability,
  canCheckTenantSlugAvailability,
  companySignupSchema,
  normalizeEmailInput,
  normalizeTenantSlugInput,
  normalizeWebsiteInput,
  type CompanySignupFormValues,
  type CompanySignupRequestPayload
} from "../company-signup-schema";
import type { CompanySignupRequestResponse } from "../company-signup-types";

const companySizeOptions = [
  { label: "Select size", value: "" },
  { label: "1-10", value: "1-10" },
  { label: "11-50", value: "11-50" },
  { label: "51-200", value: "51-200" },
  { label: "201-500", value: "201-500" },
  { label: "501-1000", value: "501-1000" },
  { label: "1000+", value: "1000+" }
] as const;

const companySignupDefaultValues: CompanySignupFormValues = {
  adminEmail: "",
  adminFirstName: "",
  adminLastName: "",
  companyName: "",
  companySize: "",
  companyWebsite: "",
  country: "",
  desiredTenantSlug: "",
  message: "",
  phone: "",
  preferredLanguage: "en",
  timezone: ""
};

export function CompanySignupPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const submitInFlightRef = useRef(false);
  const lastTenantSlugCheckRef = useRef("");
  const lastAdminEmailCheckRef = useRef("");
  const lastWebsiteCheckRef = useRef("");
  const [submittedRequest, setSubmittedRequest] = useState<CompanySignupRequestResponse | null>(null);
  const [createCompanySignupRequest, createState] = useCreateCompanySignupRequestMutation();
  const [checkTenantSlug, tenantSlugAvailability] = useLazyCheckCompanySignupTenantSlugAvailabilityQuery();
  const [checkAdminEmail, adminEmailAvailability] = useLazyCheckCompanySignupAdminEmailAvailabilityQuery();
  const [checkWebsite, websiteAvailability] = useLazyCheckCompanySignupWebsiteAvailabilityQuery();

  const {
    formState: { errors, isSubmitting, isValid },
    control,
    handleSubmit,
    register,
    reset,
    setValue,
    watch
  } = useForm<CompanySignupFormValues, unknown, CompanySignupRequestPayload>({
    defaultValues: companySignupDefaultValues,
    mode: "onChange",
    resolver: zodResolver(companySignupSchema)
  });

  const desiredTenantSlug = normalizeTenantSlugInput(watch("desiredTenantSlug") ?? "");
  const adminEmail = normalizeEmailInput(watch("adminEmail") ?? "");
  const companyWebsite = normalizeWebsiteInput(watch("companyWebsite") ?? "");
  const selectedCountry = watch("country") ?? "";
  const selectedTimezone = watch("timezone") ?? "";
  const debouncedTenantSlug = useDebouncedValue(desiredTenantSlug, 500);
  const debouncedAdminEmail = useDebouncedValue(adminEmail, 500);
  const debouncedCompanyWebsite = useDebouncedValue(companyWebsite, 500);
  const tenantSlugConflict =
    tenantSlugAvailability.currentData?.value === debouncedTenantSlug &&
    tenantSlugAvailability.currentData.available === false;
  const adminEmailConflict =
    adminEmailAvailability.currentData?.value === debouncedAdminEmail &&
    adminEmailAvailability.currentData.available === false;
  const tenantSlugAvailabilityResolved = tenantSlugAvailability.currentData?.value === debouncedTenantSlug;
  const adminEmailAvailabilityResolved = adminEmailAvailability.currentData?.value === debouncedAdminEmail;
  const isSubmitDisabled =
    Boolean(submittedRequest) ||
    createState.isLoading ||
    isSubmitting ||
    !isValid ||
    tenantSlugAvailability.isFetching ||
    adminEmailAvailability.isFetching ||
    !tenantSlugAvailabilityResolved ||
    !adminEmailAvailabilityResolved ||
    tenantSlugConflict ||
    adminEmailConflict;

  useEffect(() => {
    if (!canCheckTenantSlugAvailability(debouncedTenantSlug)) {
      return;
    }

    if (lastTenantSlugCheckRef.current === debouncedTenantSlug) {
      return;
    }

    lastTenantSlugCheckRef.current = debouncedTenantSlug;
    void checkTenantSlug(debouncedTenantSlug, true);
  }, [checkTenantSlug, debouncedTenantSlug]);

  useEffect(() => {
    if (!canCheckAdminEmailAvailability(debouncedAdminEmail)) {
      return;
    }

    if (lastAdminEmailCheckRef.current === debouncedAdminEmail) {
      return;
    }

    lastAdminEmailCheckRef.current = debouncedAdminEmail;
    void checkAdminEmail(debouncedAdminEmail, true);
  }, [checkAdminEmail, debouncedAdminEmail]);

  useEffect(() => {
    if (!canCheckCompanyWebsiteAvailability(debouncedCompanyWebsite)) {
      return;
    }

    if (lastWebsiteCheckRef.current === debouncedCompanyWebsite) {
      return;
    }

    lastWebsiteCheckRef.current = debouncedCompanyWebsite;
    void checkWebsite(debouncedCompanyWebsite, true);
  }, [checkWebsite, debouncedCompanyWebsite]);

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

  const onSubmit = async (values: CompanySignupRequestPayload) => {
    if (submitInFlightRef.current || createState.isLoading || submittedRequest) {
      return;
    }

    submitInFlightRef.current = true;

    try {
      const request = await createCompanySignupRequest(values).unwrap();
      setSubmittedRequest(request);
      reset(companySignupDefaultValues);
      lastTenantSlugCheckRef.current = "";
      lastAdminEmailCheckRef.current = "";
      lastWebsiteCheckRef.current = "";
      showToast({
        title: "Signup request sent",
        description: "Your request is pending approval.",
        tone: "success"
      });
    } catch (error) {
      const message = getCompanySignupErrorMessage(error);
      showToast({ ...message, tone: "error" });
    } finally {
      submitInFlightRef.current = false;
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 lg:px-6 lg:py-10">
        <header className="mb-7">
          <p className="text-sm font-semibold uppercase text-primary">Company access</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-foreground">Request a company workspace</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Submit company details for approval. The admin email will receive access after the workspace is approved.
          </p>
        </header>

        {submittedRequest ? (
          <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <div className="flex gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-semibold">Request pending approval</p>
                <p className="mt-1">
                  {submittedRequest.companyName} was submitted for workspace {submittedRequest.desiredTenantSlug}.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <form className="grid gap-5 lg:grid-cols-[1fr_20rem]" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-5">
            <section className="rounded-lg border border-border bg-surface p-5">
              <h2 className="text-base font-semibold">Company</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Company name" error={errors.companyName?.message} required>
                  <Input placeholder="Acme Operations" required {...register("companyName")} />
                </Field>

                <Field label="Desired workspace slug" error={errors.desiredTenantSlug?.message} required>
                  <Input
                    autoCapitalize="none"
                    autoCorrect="off"
                    placeholder="acme-operations"
                    required
                    {...register("desiredTenantSlug")}
                  />
                  <AvailabilityMessage
                    isFetching={tenantSlugAvailability.isFetching}
                    isTouched={Boolean(desiredTenantSlug)}
                    status={
                      tenantSlugAvailability.currentData?.value === debouncedTenantSlug
                        ? tenantSlugAvailability.currentData
                        : undefined
                    }
                    type="tenantSlug"
                  />
                </Field>

                <Field label="Company website" error={errors.companyWebsite?.message}>
                  <Input placeholder="https://acme.example" {...register("companyWebsite")} />
                  <WebsiteAvailabilityMessage
                    isFetching={websiteAvailability.isFetching}
                    isTouched={Boolean(companyWebsite)}
                    status={
                      websiteAvailability.currentData?.value === debouncedCompanyWebsite
                        ? websiteAvailability.currentData
                        : undefined
                    }
                  />
                </Field>

                <Field label="Company size" error={errors.companySize?.message} required>
                  <Select required {...register("companySize")}>
                    {companySizeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Country" error={errors.country?.message}>
                  <CountrySelect includeEmptyOption {...register("country")} />
                </Field>

                <Field label="Timezone" error={errors.timezone?.message} required>
                  <TimezoneSelect countryCode={selectedCountry} includeEmptyOption required {...register("timezone")} />
                </Field>
              </div>
            </section>

            <section className="rounded-lg border border-border bg-surface p-5">
              <h2 className="text-base font-semibold">Admin user</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="First name" error={errors.adminFirstName?.message} required>
                  <Input placeholder="Maria" required {...register("adminFirstName")} />
                </Field>

                <Field label="Last name" error={errors.adminLastName?.message} required>
                  <Input placeholder="Rojas" required {...register("adminLastName")} />
                </Field>

                <Field label="Admin email" error={errors.adminEmail?.message} required>
                  <Input
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    placeholder="admin@company.com"
                    required
                    type="email"
                    {...register("adminEmail")}
                  />
                  <AvailabilityMessage
                    isFetching={adminEmailAvailability.isFetching}
                    isTouched={Boolean(adminEmail)}
                    status={
                      adminEmailAvailability.currentData?.value === debouncedAdminEmail
                        ? adminEmailAvailability.currentData
                        : undefined
                    }
                    type="adminEmail"
                  />
                </Field>

                <Field label="Phone number" error={errors.phone?.message}>
                  <Controller
                    control={control}
                    name="phone"
                    render={({ field }) => <PhoneInput countryCode={selectedCountry} {...field} />}
                  />
                </Field>

                <input type="hidden" value="en" {...register("preferredLanguage")} />
              </div>
            </section>

            <section className="rounded-lg border border-border bg-surface p-5">
              <Field label="Optional message" error={errors.message?.message}>
                <textarea
                  className="mt-1 min-h-28 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15"
                  placeholder="Anything the approval team should know"
                  {...register("message")}
                />
              </Field>
            </section>
          </div>

          <aside className="space-y-4">
            <div className="rounded-lg border border-border bg-surface p-5">
              <h2 className="text-base font-semibold">Review</h2>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <CheckItem>Workspace slug must be unique.</CheckItem>
                <CheckItem>Admin email can only have one pending request.</CheckItem>
                <CheckItem>Approval creates the tenant and owner access.</CheckItem>
              </div>
            </div>

            <Button className="w-full" disabled={isSubmitDisabled} type="submit">
              {createState.isLoading || isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4" aria-hidden="true" />
              )}
              {submittedRequest ? "Request submitted" : createState.isLoading || isSubmitting ? "Submitting..." : "Submit request"}
            </Button>
          </aside>
        </form>
      </div>

      <SignupSuccessDialog
        isOpen={Boolean(submittedRequest)}
        request={submittedRequest}
        onContinue={() => router.replace(loginPath)}
      />
    </main>
  );
}

function SignupSuccessDialog({
  isOpen,
  onContinue,
  request
}: Readonly<{
  isOpen: boolean;
  onContinue: () => void;
  request: CompanySignupRequestResponse | null;
}>) {
  if (!isOpen || !request) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4">
      <div
        aria-labelledby="company-signup-success-title"
        aria-modal="true"
        className="w-full max-w-md rounded-lg border border-emerald-200 bg-surface p-5 shadow-xl"
        role="dialog"
      >
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-emerald-900" id="company-signup-success-title">
              Request submitted
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your company workspace request was sent for approval. We will notify the admin email when access is ready.
            </p>
            <div className="mt-4 rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              <p className="font-medium">{request.companyName}</p>
              <p className="mt-1 text-emerald-800">Workspace: {request.desiredTenantSlug}</p>
            </div>
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <Button onClick={onContinue} type="button">
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  children,
  error,
  label,
  required
}: Readonly<{ children: ReactNode; error?: string; label: string; required?: boolean }>) {
  return (
    <label className="block">
      <span className="text-sm font-medium">
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-1">
            *
          </span>
        ) : null}
      </span>
      <div className="mt-1">{children}</div>
      {error ? <span className="mt-1 block text-sm text-rose-600">{error}</span> : null}
    </label>
  );
}

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  props,
  ref
) {
  return (
    <select
      className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
      ref={ref}
      {...props}
    />
  );
});

function CheckItem({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex gap-2">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

function AvailabilityMessage({
  isFetching,
  isTouched,
  status,
  type
}: Readonly<{
  isFetching: boolean;
  isTouched: boolean;
  status?: { readonly available: boolean; readonly reason?: string };
  type: "tenantSlug" | "adminEmail";
}>) {
  if (!isTouched) {
    return null;
  }

  if (isFetching) {
    return (
      <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
        Checking availability
      </span>
    );
  }

  if (!status) {
    return null;
  }

  if (status.available) {
    return (
      <span className="mt-1 flex items-center gap-1 text-xs text-emerald-700">
        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
        Available
      </span>
    );
  }

  return (
    <span className="mt-1 flex items-center gap-1 text-xs text-rose-700">
      <AlertCircle className="h-3 w-3" aria-hidden="true" />
      {getUnavailableMessage(type, status.reason)}
    </span>
  );
}

function WebsiteAvailabilityMessage({
  isFetching,
  isTouched,
  status
}: Readonly<{
  isFetching: boolean;
  isTouched: boolean;
  status?: { readonly duplicateWarning: boolean };
}>) {
  if (!isTouched) {
    return null;
  }

  if (isFetching) {
    return (
      <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
        Checking website
      </span>
    );
  }

  if (!status?.duplicateWarning) {
    return null;
  }

  return (
    <span className="mt-1 flex items-center gap-1 text-xs text-amber-700">
      <AlertCircle className="h-3 w-3" aria-hidden="true" />
      A pending request already uses this website.
    </span>
  );
}

function getUnavailableMessage(type: "tenantSlug" | "adminEmail", reason: string | undefined) {
  if (type === "adminEmail") {
    return "A request is already pending for this email.";
  }

  if (reason === "RESERVED") {
    return "This workspace slug is reserved.";
  }

  if (reason === "TENANT_EXISTS") {
    return "This workspace is already registered.";
  }

  if (reason === "PENDING_REQUEST_EXISTS") {
    return "A request is already pending for this workspace.";
  }

  return "This workspace slug is not available.";
}
