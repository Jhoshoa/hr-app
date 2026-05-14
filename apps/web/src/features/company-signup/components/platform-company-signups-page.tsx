"use client";

import React from "react";
import { useEffect, useMemo, useState } from "react";
import { Archive, Check, Eye, RotateCcw, Search, XCircle } from "lucide-react";
import { PageHeader } from "@/components/app-shell/page-header";
import { ErrorState } from "@/components/data-display/error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { SideDrawer } from "@/components/ui/side-drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { usePlatformRoles } from "@/hooks/use-platform-roles";
import { cn } from "@/lib/utils";
import {
  useApprovePlatformCompanySignupRequestMutation,
  useArchivePlatformTenantMutation,
  useGetPlatformCompanySignupRequestQuery,
  useListPlatformCompanySignupRequestsQuery,
  useReactivatePlatformTenantMutation,
  useRejectPlatformCompanySignupRequestMutation
} from "../company-signup-api";
import type {
  CompanySignupStatus,
  PlatformCompanySignupRequest
} from "../company-signup-types";
import {
  canReviewCompanySignup,
  formatPlatformDate,
  getCompanySignupAdminName,
  getCompanySignupStatusTone,
  getPlatformCompanySignupTotalPages,
  isValidPlatformTenantSlug,
  PLATFORM_COMPANY_SIGNUPS_PAGE_SIZE
} from "../platform-company-signups-utils";

const statusOptions: Array<{ readonly label: string; readonly value: CompanySignupStatus | "ALL" }> = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Cancelled", value: "CANCELLED" }
];

type PendingReview =
  | { readonly action: "approve"; readonly request: PlatformCompanySignupRequest }
  | { readonly action: "reject"; readonly request: PlatformCompanySignupRequest };

type PendingTenantAction =
  | { readonly action: "archive"; readonly tenantId: string; readonly companyName: string }
  | { readonly action: "reactivate"; readonly tenantId: string; readonly companyName: string };

export function PlatformCompanySignupsPage() {
  const platformRoles = usePlatformRoles();
  const canReview = canReviewCompanySignup(platformRoles);
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CompanySignupStatus | "ALL">("PENDING");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [pendingReview, setPendingReview] = useState<PendingReview | null>(null);
  const [pendingTenantAction, setPendingTenantAction] = useState<PendingTenantAction | null>(null);

  const { data, isError, isFetching } = useListPlatformCompanySignupRequestsQuery({
    page,
    pageSize: PLATFORM_COMPANY_SIGNUPS_PAGE_SIZE,
    search,
    status
  });

  const totalPages = getPlatformCompanySignupTotalPages(data?.total ?? 0);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  const onStatusChange = (nextStatus: CompanySignupStatus | "ALL") => {
    setPage(1);
    setStatus(nextStatus);
  };

  const onReviewComplete = (message: string) => {
    setPendingReview(null);
    setSelectedRequestId(null);
    showToast({ title: message, tone: "success" });
  };

  return (
    <>
      <PageHeader
        title="Company signups"
        description="Review company requests, approve tenant provisioning, and manage approved tenant access."
      />

      <section className="rounded-lg border border-border bg-surface">
        <header className="flex flex-col gap-3 border-b border-border px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              className="pl-9"
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search company, slug, or admin email"
              value={searchInput}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <button
                className={cn(
                  "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                  status === option.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface text-muted-foreground hover:text-foreground"
                )}
                key={option.value}
                onClick={() => onStatusChange(option.value)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </header>

        {isError ? <ErrorState title="Company signup requests could not load" /> : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">Company</th>
                <th className="px-5 py-3 font-semibold">Admin</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Requested slug</th>
                <th className="px-5 py-3 font-semibold">Submitted</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isFetching && !data ? <PlatformCompanySignupRowsSkeleton /> : null}

              {data?.items.map((request) => (
                <tr className="hover:bg-muted/30" key={request.id}>
                  <td className="px-5 py-4">
                    <p className="font-medium">{request.companyName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{request.companyWebsite ?? "No website"}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium">{getCompanySignupAdminName(request)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{request.adminEmail}</p>
                  </td>
                  <td className="px-5 py-4">
                    <Badge tone={getCompanySignupStatusTone(request.status)}>{request.status}</Badge>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs">{request.desiredTenantSlug}</td>
                  <td className="px-5 py-4 text-muted-foreground">{formatPlatformDate(request.createdAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        aria-label={`View ${request.companyName}`}
                        className="h-8 w-8 px-0"
                        onClick={() => setSelectedRequestId(request.id)}
                        type="button"
                        variant="secondary"
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      {request.status === "PENDING" && canReview ? (
                        <>
                          <Button
                            aria-label={`Approve ${request.companyName}`}
                            className="h-8 w-8 px-0"
                            onClick={() => setPendingReview({ action: "approve", request })}
                            type="button"
                            variant="secondary"
                          >
                            <Check className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            aria-label={`Reject ${request.companyName}`}
                            className="h-8 w-8 px-0"
                            onClick={() => setPendingReview({ action: "reject", request })}
                            type="button"
                            variant="secondary"
                          >
                            <XCircle className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!isFetching && data?.items.length === 0 ? (
          <div className="border-t border-border px-5 py-10 text-center">
            <p className="font-medium">No company signup requests exist.</p>
            <p className="mt-1 text-sm text-muted-foreground">New public signup requests will appear here.</p>
          </div>
        ) : null}

        {(data?.total ?? 0) > PLATFORM_COMPANY_SIGNUPS_PAGE_SIZE ? (
          <footer className="flex items-center justify-between border-t border-border px-5 py-3 text-sm">
            <span className="text-muted-foreground">
              Page {page} of {totalPages} · {data?.total ?? 0} requests
            </span>
            <div className="flex gap-2">
              <Button disabled={page === 1 || isFetching} onClick={() => setPage((current) => current - 1)} variant="secondary">
                Previous
              </Button>
              <Button
                disabled={page === totalPages || isFetching}
                onClick={() => setPage((current) => current + 1)}
                variant="secondary"
              >
                Next
              </Button>
            </div>
          </footer>
        ) : null}
      </section>

      <PlatformCompanySignupDrawer
        canReview={canReview}
        onClose={() => setSelectedRequestId(null)}
        onTenantAction={setPendingTenantAction}
        onReview={setPendingReview}
        requestId={selectedRequestId}
      />

      <ReviewDialog
        onComplete={onReviewComplete}
        onClose={() => setPendingReview(null)}
        pendingReview={pendingReview}
      />

      <TenantStatusDialog
        onClose={() => setPendingTenantAction(null)}
        pendingAction={pendingTenantAction}
        showToast={showToast}
      />
    </>
  );
}

function PlatformCompanySignupDrawer({
  canReview,
  onClose,
  onReview,
  onTenantAction,
  requestId
}: Readonly<{
  canReview: boolean;
  onClose: () => void;
  onReview: (review: PendingReview) => void;
  onTenantAction: (action: PendingTenantAction) => void;
  requestId: string | null;
}>) {
  const { data: request, isFetching } = useGetPlatformCompanySignupRequestQuery(requestId ?? "", {
    skip: !requestId
  });

  return (
    <SideDrawer
      description="Review the request before provisioning or changing tenant access."
      isOpen={Boolean(requestId)}
      onClose={onClose}
      title="Company signup details"
    >
      {isFetching && !request ? (
        <div className="space-y-4">
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : null}

      {request ? (
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">{request.companyName}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{request.desiredTenantSlug}</p>
            </div>
            <Badge tone={getCompanySignupStatusTone(request.status)}>{request.status}</Badge>
          </div>

          <DetailGrid request={request} />

          {request.message ? (
            <section>
              <h4 className="text-sm font-semibold">Message</h4>
              <p className="mt-2 rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                {request.message}
              </p>
            </section>
          ) : null}

          {request.rejectionReason ? (
            <section>
              <h4 className="text-sm font-semibold">Rejection reason</h4>
              <p className="mt-2 rounded-md border border-border bg-rose-50 p-3 text-sm text-rose-800">
                {request.rejectionReason}
              </p>
            </section>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
            {request.status === "APPROVED" && request.approvedTenant && canReview ? (
              <>
                {request.approvedTenant.status === "ARCHIVED" ? (
                  <Button
                    onClick={() =>
                      onTenantAction({
                        action: "reactivate",
                        companyName: request.companyName,
                        tenantId: request.approvedTenant?.id ?? ""
                      })
                    }
                    type="button"
                    variant="secondary"
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    Reactivate tenant
                  </Button>
                ) : (
                  <Button
                    onClick={() =>
                      onTenantAction({
                        action: "archive",
                        companyName: request.companyName,
                        tenantId: request.approvedTenant?.id ?? ""
                      })
                    }
                    type="button"
                    variant="secondary"
                  >
                    <Archive className="h-4 w-4" aria-hidden="true" />
                    Archive tenant
                  </Button>
                )}
              </>
            ) : null}

            {request.status === "PENDING" && canReview ? (
              <>
                <Button onClick={() => onReview({ action: "reject", request })} type="button" variant="secondary">
                  <XCircle className="h-4 w-4" aria-hidden="true" />
                  Reject
                </Button>
                <Button onClick={() => onReview({ action: "approve", request })} type="button">
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Approve
                </Button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </SideDrawer>
  );
}

function DetailGrid({ request }: Readonly<{ request: PlatformCompanySignupRequest }>) {
  const details = useMemo(
    () => [
      ["Admin", getCompanySignupAdminName(request)],
      ["Admin email", request.adminEmail],
      ["Company size", request.companySize ?? "Not provided"],
      ["Country", request.country ?? "Not provided"],
      ["Timezone", request.timezone ?? "Not provided"],
      ["Language", request.preferredLanguage],
      ["Phone", request.phone ?? "Not provided"],
      ["Website", request.companyWebsite ?? "Not provided"],
      ["Submitted", formatPlatformDate(request.createdAt)],
      ["Reviewed", formatPlatformDate(request.reviewedAt)],
      ["Tenant status", request.approvedTenant?.status ?? "Not provisioned"]
    ],
    [request]
  );

  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {details.map(([label, value]) => (
        <div className="rounded-md border border-border p-3" key={label}>
          <dt className="text-xs font-semibold uppercase text-muted-foreground">{label}</dt>
          <dd className="mt-1 break-words text-sm">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ReviewDialog({
  onClose,
  onComplete,
  pendingReview
}: Readonly<{
  onClose: () => void;
  onComplete: (message: string) => void;
  pendingReview: PendingReview | null;
}>) {
  const [approveRequest, approveState] = useApprovePlatformCompanySignupRequestMutation();
  const [rejectRequest, rejectState] = useRejectPlatformCompanySignupRequestMutation();
  const [finalTenantSlug, setFinalTenantSlug] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFinalTenantSlug(pendingReview?.request.desiredTenantSlug ?? "");
    setRejectionReason("");
    setError(null);
  }, [pendingReview]);

  if (!pendingReview) {
    return null;
  }

  const isWorking = approveState.isLoading || rejectState.isLoading;
  const isApprove = pendingReview.action === "approve";

  const onSubmit = async () => {
    setError(null);

    try {
      if (isApprove) {
        if (!isValidPlatformTenantSlug(finalTenantSlug)) {
          setError("Final tenant slug must be 3-63 characters and cannot start or end with a hyphen.");
          return;
        }

        await approveRequest({
          finalTenantSlug: finalTenantSlug.trim(),
          id: pendingReview.request.id,
          initialAdminRoleKey: "owner"
        }).unwrap();
        onComplete("Company signup approved");
      } else {
        const reason = rejectionReason.trim();

        if (reason.length < 3) {
          setError("Rejection reason is required.");
          return;
        }

        await rejectRequest({
          id: pendingReview.request.id,
          rejectionReason: reason
        }).unwrap();
        onComplete("Company signup rejected");
      }
    } catch {
      setError(isApprove ? "The request could not be approved." : "The request could not be rejected.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4">
      <div className="w-full max-w-lg rounded-lg border border-border bg-surface p-5 shadow-xl">
        <h2 className="text-base font-semibold">
          {isApprove ? "Approve company signup" : "Reject company signup"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {isApprove
            ? `This will create a tenant for ${pendingReview.request.companyName} and grant owner access to ${pendingReview.request.adminEmail}.`
            : `This will mark ${pendingReview.request.companyName} as rejected and keep the request for audit history.`}
        </p>

        <div className="mt-4 space-y-4">
          {isApprove ? (
            <label className="block">
              <span className="text-sm font-medium">Final tenant slug</span>
              <Input
                className="mt-1 font-mono"
                onChange={(event) => setFinalTenantSlug(event.target.value)}
                value={finalTenantSlug}
              />
            </label>
          ) : (
            <label className="block">
              <span className="text-sm font-medium">Rejection reason</span>
              <textarea
                className="mt-1 min-h-28 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
                onChange={(event) => setRejectionReason(event.target.value)}
                value={rejectionReason}
              />
            </label>
          )}
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button disabled={isWorking} onClick={onClose} type="button" variant="secondary">
            Cancel
          </Button>
          <Button disabled={isWorking} onClick={onSubmit} type="button">
            {isWorking ? "Saving..." : isApprove ? "Approve" : "Reject"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function TenantStatusDialog({
  onClose,
  pendingAction,
  showToast
}: Readonly<{
  onClose: () => void;
  pendingAction: PendingTenantAction | null;
  showToast: (toast: { title: string; description?: string; tone?: "success" | "error" | "info" }) => void;
}>) {
  const [archiveTenant, archiveState] = useArchivePlatformTenantMutation();
  const [reactivateTenant, reactivateState] = useReactivatePlatformTenantMutation();

  const onConfirm = async () => {
    if (!pendingAction) {
      return;
    }

    try {
      if (pendingAction.action === "archive") {
        await archiveTenant({ id: pendingAction.tenantId, reason: "Archived from platform company signup review." }).unwrap();
        showToast({ title: "Tenant archived", tone: "success" });
      } else {
        await reactivateTenant(pendingAction.tenantId).unwrap();
        showToast({ title: "Tenant reactivated", tone: "success" });
      }
      onClose();
    } catch {
      showToast({
        title: "Tenant status could not be updated",
        description: "Review the tenant status and try again.",
        tone: "error"
      });
    }
  };

  return (
    <ConfirmDialog
      confirmLabel={pendingAction?.action === "archive" ? "Archive" : "Reactivate"}
      description={
        pendingAction?.action === "archive"
          ? `This will disable tenant access for ${pendingAction.companyName} without deleting data.`
          : `This will restore active tenant access for ${pendingAction?.companyName}.`
      }
      isOpen={Boolean(pendingAction)}
      isWorking={archiveState.isLoading || reactivateState.isLoading}
      onCancel={onClose}
      onConfirm={onConfirm}
      title={pendingAction?.action === "archive" ? "Archive tenant" : "Reactivate tenant"}
    />
  );
}

function PlatformCompanySignupRowsSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }, (_, index) => (
        <tr key={index}>
          <td className="px-5 py-4">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="mt-2 h-3 w-28" />
          </td>
          <td className="px-5 py-4">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="mt-2 h-3 w-48" />
          </td>
          <td className="px-5 py-4">
            <Skeleton className="h-6 w-20" />
          </td>
          <td className="px-5 py-4">
            <Skeleton className="h-4 w-28" />
          </td>
          <td className="px-5 py-4">
            <Skeleton className="h-4 w-32" />
          </td>
          <td className="px-5 py-4">
            <div className="flex justify-end gap-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}
