"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Archive, Edit3, Plus, RotateCcw } from "lucide-react";
import { ErrorState } from "@/components/data-display/error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { SideDrawer } from "@/components/ui/side-drawer";
import { useToast } from "@/components/ui/toast";
import { CountrySelect } from "@/features/geo/components/country-select";
import { TimezoneSelect } from "@/features/timezones/components/timezone-select";
import { useCurrentTenant } from "@/hooks/use-current-tenant";
import { DEFAULT_COUNTRY_CODE } from "@hr-app/geo";
import { DEFAULT_TIME_ZONE } from "@hr-app/timezones";
import {
  useArchiveOrganizationRecordMutation,
  useCreateOrganizationRecordMutation,
  useListOrganizationRecordsQuery,
  useReactivateOrganizationRecordMutation,
  useUpdateOrganizationRecordMutation
} from "../organization-api";
import { getOrganizationRecordDetail, ORGANIZATION_PAGE_SIZE, paginateRecords } from "../organization-utils";
import { DrawerFormSkeleton, OrganizationTableSkeleton, RequiredLabel } from "./organization-loading";
import type {
  OrganizationCatalogConfig,
  OrganizationRecord,
  OrganizationRecordPayload
} from "../organization-types";

type DrawerState =
  | { readonly mode: "create"; readonly record?: undefined }
  | { readonly mode: "edit"; readonly record: OrganizationRecord };

interface PendingAction {
  readonly action: "archive" | "reactivate";
  readonly record: OrganizationRecord;
}

export function OrganizationCatalogPanel({ catalog }: Readonly<{ catalog: OrganizationCatalogConfig }>) {
  const { showToast } = useToast();
  const currentTenant = useCurrentTenant();
  const tenantSlug = currentTenant.tenantSlug;
  const [page, setPage] = useState(1);
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const { data = [], isError, isFetching, isLoading } = useListOrganizationRecordsQuery(
    { kind: catalog.kind, tenantSlug },
    { skip: !tenantSlug }
  );
  const [archiveRecord, archiveState] = useArchiveOrganizationRecordMutation();
  const [reactivateRecord, reactivateState] = useReactivateOrganizationRecordMutation();

  const sortedRecords = useMemo(
    () => [...data].sort((first, second) => first.name.localeCompare(second.name)),
    [data]
  );
  const paginated = paginateRecords(sortedRecords, page, ORGANIZATION_PAGE_SIZE);
  const showTableSkeleton = isLoading || (isFetching && sortedRecords.length === 0);

  useEffect(() => {
    setPage(1);
    setDrawer(null);
    setPendingAction(null);
  }, [catalog.kind, tenantSlug]);

  const onConfirmAction = async () => {
    if (!pendingAction) {
      return;
    }

    try {
      if (pendingAction.action === "archive") {
        await archiveRecord({ kind: catalog.kind, id: pendingAction.record.id, tenantSlug }).unwrap();
        showToast({ title: `${catalog.singularLabel} archived`, tone: "success" });
      } else {
        await reactivateRecord({ kind: catalog.kind, id: pendingAction.record.id, tenantSlug }).unwrap();
        showToast({ title: `${catalog.singularLabel} reactivated`, tone: "success" });
      }
      setPendingAction(null);
    } catch {
      showToast({ title: "Action failed", description: "The record could not be updated.", tone: "error" });
    }
  };

  return (
    <section className="rounded-lg border border-border bg-surface">
      <header className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">{catalog.label}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{catalog.description}</p>
        </div>
        <Button onClick={() => setDrawer({ mode: "create" })} type="button">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add {catalog.singularLabel}
        </Button>
      </header>

      {isError ? <ErrorState title={`${catalog.label} could not load`} /> : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-5 py-3 font-semibold">Details</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Updated</th>
              <th className="px-5 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          {showTableSkeleton ? (
            <OrganizationTableSkeleton columns={5} />
          ) : (
            <tbody className="divide-y divide-border">
              {paginated.items.map((record) => (
                <tr key={record.id}>
                  <td className="px-5 py-4 font-medium">{record.name}</td>
                  <td className="px-5 py-4 text-muted-foreground">{getOrganizationRecordDetail(record)}</td>
                  <td className="px-5 py-4">
                    <Badge tone={record.status === "ACTIVE" ? "green" : "gray"}>{record.status}</Badge>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(record.updatedAt))}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        aria-label={`Edit ${record.name}`}
                        className="h-8 w-8 px-0"
                        onClick={() => setDrawer({ mode: "edit", record })}
                        type="button"
                        variant="secondary"
                      >
                        <Edit3 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      {record.status === "ARCHIVED" ? (
                        <Button
                          aria-label={`Reactivate ${record.name}`}
                          className="h-8 w-8 px-0"
                          onClick={() => setPendingAction({ action: "reactivate", record })}
                          type="button"
                          variant="secondary"
                        >
                          <RotateCcw className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      ) : (
                        <Button
                          aria-label={`Archive ${record.name}`}
                          className="h-8 w-8 px-0"
                          onClick={() => setPendingAction({ action: "archive", record })}
                          type="button"
                          variant="secondary"
                        >
                          <Archive className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>

      {!showTableSkeleton && sortedRecords.length === 0 ? (
        <div className="border-t border-border px-5 py-10 text-center">
          <p className="font-medium">No records exist.</p>
          <p className="mt-1 text-sm text-muted-foreground">Add the first {catalog.singularLabel} to use it later.</p>
        </div>
      ) : null}

      {sortedRecords.length > ORGANIZATION_PAGE_SIZE ? (
        <footer className="flex items-center justify-between border-t border-border px-5 py-3 text-sm">
          <span className="text-muted-foreground">
            Page {paginated.page} of {paginated.totalPages}
          </span>
          <div className="flex gap-2">
            <Button disabled={paginated.page === 1} onClick={() => setPage((current) => current - 1)} variant="secondary">
              Previous
            </Button>
            <Button
              disabled={paginated.page === paginated.totalPages}
              onClick={() => setPage((current) => current + 1)}
              variant="secondary"
            >
              Next
            </Button>
          </div>
        </footer>
      ) : null}

      <OrganizationRecordDrawer catalog={catalog} drawer={drawer} onClose={() => setDrawer(null)} tenantSlug={tenantSlug} />

      <ConfirmDialog
        confirmLabel={pendingAction?.action === "archive" ? "Archive" : "Reactivate"}
        description={
          pendingAction?.action === "archive"
            ? `This will hide "${pendingAction.record.name}" from active configuration lists without deleting it.`
            : `This will make "${pendingAction?.record.name}" available again.`
        }
        isOpen={Boolean(pendingAction)}
        isWorking={archiveState.isLoading || reactivateState.isLoading}
        onCancel={() => setPendingAction(null)}
        onConfirm={onConfirmAction}
        title={pendingAction?.action === "archive" ? "Archive record" : "Reactivate record"}
      />
    </section>
  );
}

function OrganizationRecordDrawer({
  catalog,
  drawer,
  onClose,
  tenantSlug
}: Readonly<{
  catalog: OrganizationCatalogConfig;
  drawer: DrawerState | null;
  onClose: () => void;
  tenantSlug: string;
}>) {
  const { showToast } = useToast();
  const [createRecord, createState] = useCreateOrganizationRecordMutation();
  const [updateRecord, updateState] = useUpdateOrganizationRecordMutation();
  const [formState, setFormState] = useState<OrganizationRecordPayload>({});
  const [initialFormState, setInitialFormState] = useState<OrganizationRecordPayload>({});
  const [formReadyKey, setFormReadyKey] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const drawerKey = drawer ? `${drawer.mode}:${drawer.mode === "edit" ? drawer.record.id : catalog.kind}` : null;

  useEffect(() => {
    if (!drawer) {
      setFormState({});
      setInitialFormState({});
      setFormReadyKey(null);
      return;
    }

    const nextState =
      drawer.mode === "edit"
        ? drawer.record
        : catalog.kind === "location"
          ? { country: DEFAULT_COUNTRY_CODE, timezone: DEFAULT_TIME_ZONE }
          : {};
    setFormState(nextState);
    setInitialFormState(nextState);
    setFormReadyKey(drawerKey);
    setFormError(null);
  }, [drawer, drawerKey]);

  const isSaving = createState.isLoading || updateState.isLoading;
  const isFormReady = Boolean(drawerKey && formReadyKey === drawerKey);
  const title = drawer?.mode === "edit" ? `Edit ${catalog.singularLabel}` : `Add ${catalog.singularLabel}`;

  const updateField = (key: keyof OrganizationRecordPayload, value: string) => {
    setFormState((current) => ({ ...current, [key]: value }));
  };

  const cleanPayload = (source: OrganizationRecordPayload) => {
    const payload: OrganizationRecordPayload = {};

    for (const field of catalog.fields) {
      const rawValue = source[field.key];
      const value = typeof rawValue === "string" ? rawValue.trim() : rawValue;

      if (value) {
        payload[field.key] = value;
      } else if (drawer?.mode === "edit" && field.key !== "name" && field.key !== "country" && field.key !== "timezone") {
        payload[field.key] = null;
      }
    }

    return payload;
  };

  const currentPayload = cleanPayload(formState);
  const initialPayload = cleanPayload(initialFormState);
  const isFormValid = catalog.fields.every((field) => !field.required || Boolean(currentPayload[field.key]));
  const isDirty = JSON.stringify(currentPayload) !== JSON.stringify(initialPayload);
  const canSave = !isSaving && isFormReady && isFormValid && (drawer?.mode === "edit" ? isDirty : true);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = cleanPayload(formState);
    const missingRequired = catalog.fields.find((field) => field.required && !payload[field.key]);

    if (missingRequired) {
      setFormError(`${missingRequired.label} is required.`);
      return;
    }

    try {
      if (drawer?.mode === "edit") {
        await updateRecord({ kind: catalog.kind, id: drawer.record.id, payload, tenantSlug }).unwrap();
        showToast({ title: `${catalog.singularLabel} updated`, tone: "success" });
      } else {
        await createRecord({ kind: catalog.kind, payload, tenantSlug }).unwrap();
        showToast({ title: `${catalog.singularLabel} created`, tone: "success" });
      }
      onClose();
    } catch {
      showToast({ title: "Save failed", description: "Review the values and try again.", tone: "error" });
    }
  };

  return (
    <SideDrawer
      description="Changes are scoped to the currently selected tenant."
      isOpen={Boolean(drawer)}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button disabled={isSaving} onClick={onClose} type="button" variant="secondary">
            Cancel
          </Button>
          <Button disabled={!canSave} form="organization-record-form" type="submit">
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </>
      }
    >
      <form className="space-y-4" id="organization-record-form" onSubmit={submit}>
        {!isFormReady ? (
          <DrawerFormSkeleton fields={catalog.fields.length} />
        ) : (
          catalog.fields.map((field) => (
            <label className="block" key={field.key}>
              <RequiredLabel required={field.required}>{field.label}</RequiredLabel>
              <OrganizationFieldControl
                field={field}
                formState={formState}
                onChange={updateField}
              />
            </label>
          ))
        )}

        {formError ? <p className="text-sm text-rose-600">{formError}</p> : null}
      </form>
    </SideDrawer>
  );
}

function OrganizationFieldControl({
  field,
  formState,
  onChange
}: Readonly<{
  field: OrganizationCatalogConfig["fields"][number];
  formState: OrganizationRecordPayload;
  onChange: (key: keyof OrganizationRecordPayload, value: string) => void;
}>) {
  const value = String(formState[field.key] ?? "");

  switch (field.control) {
    case "country":
      return (
        <CountrySelect
          className="mt-1"
          onChange={(event) => onChange(field.key, event.target.value)}
          value={value}
        />
      );
    case "timezone":
      return (
        <TimezoneSelect
          className="mt-1"
          countryCode={String(formState.country ?? "")}
          onChange={(event) => onChange(field.key, event.target.value)}
          value={value}
        />
      );
    default:
      return (
        <Input
          className="mt-1"
          onChange={(event) => onChange(field.key, event.target.value)}
          placeholder={field.placeholder}
          value={value}
        />
      );
  }
}
