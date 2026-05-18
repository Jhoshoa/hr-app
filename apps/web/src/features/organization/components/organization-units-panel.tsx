"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Archive, Edit3, Plus, RotateCcw, Trash2 } from "lucide-react";
import { ErrorState } from "@/components/data-display/error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { SideDrawer } from "@/components/ui/side-drawer";
import { useToast } from "@/components/ui/toast";
import { useCurrentTenant } from "@/hooks/use-current-tenant";
import { normalizeApiError } from "@/lib/api/api-error";
import {
  useCreateOrganizationRecordMutation,
  useListOrganizationRecordsQuery
} from "../organization-api";
import { ORGANIZATION_PAGE_SIZE, paginateRecords } from "../organization-utils";
import { DrawerFormSkeleton, OrganizationTableSkeleton, RequiredLabel } from "./organization-loading";
import {
  useArchiveOrganizationUnitMutation,
  useCreateOrganizationUnitMutation,
  useDeleteOrganizationUnitMutation,
  useListOrganizationUnitsQuery,
  useListOrganizationUnitTypesQuery,
  useReactivateOrganizationUnitMutation,
  useUpdateOrganizationUnitMutation
} from "../organization-units-api";
import type { OrganizationRecord } from "../organization-types";
import type {
  OrganizationUnit,
  OrganizationUnitPayload,
  OrganizationUnitType
} from "../organization-units-types";

type DrawerState =
  | { readonly mode: "create"; readonly record?: undefined }
  | { readonly mode: "edit"; readonly record: OrganizationUnit };

interface PendingAction {
  readonly action: "archive" | "delete" | "reactivate";
  readonly record: OrganizationUnit;
}

export function OrganizationUnitsPanel() {
  const { showToast } = useToast();
  const currentTenant = useCurrentTenant();
  const tenantSlug = currentTenant.tenantSlug;
  const [page, setPage] = useState(1);
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const { data = [], isError, isFetching, isLoading } = useListOrganizationUnitsQuery({ tenantSlug }, { skip: !tenantSlug });
  const { data: types = [], isFetching: isTypesFetching, isLoading: isTypesLoading } = useListOrganizationUnitTypesQuery({ tenantSlug }, { skip: !tenantSlug });
  const { data: locations = [], isFetching: isLocationsFetching, isLoading: isLocationsLoading } = useListOrganizationRecordsQuery(
    { kind: "location", tenantSlug },
    { skip: !tenantSlug }
  );
  const [archiveUnit, archiveState] = useArchiveOrganizationUnitMutation();
  const [deleteUnit, deleteState] = useDeleteOrganizationUnitMutation();
  const [reactivateUnit, reactivateState] = useReactivateOrganizationUnitMutation();

  const sortedUnits = useMemo(() => [...data].sort((first, second) => first.name.localeCompare(second.name)), [data]);
  const paginated = paginateRecords(sortedUnits, page, ORGANIZATION_PAGE_SIZE);
  const showTableSkeleton = isLoading || (isFetching && sortedUnits.length === 0);
  const isDrawerOptionsLoading =
    isTypesLoading ||
    isTypesFetching ||
    isLocationsLoading ||
    isLocationsFetching ||
    showTableSkeleton;

  useEffect(() => {
    setPage(1);
  }, [tenantSlug, sortedUnits.length]);

  const onConfirmAction = async () => {
    if (!pendingAction) {
      return;
    }

    try {
      if (pendingAction.action === "archive") {
        await archiveUnit({ tenantSlug, unitId: pendingAction.record.id }).unwrap();
        showToast({ title: "Organization unit archived", tone: "success" });
      } else if (pendingAction.action === "reactivate") {
        await reactivateUnit({ tenantSlug, unitId: pendingAction.record.id }).unwrap();
        showToast({ title: "Organization unit reactivated", tone: "success" });
      } else {
        await deleteUnit({ tenantSlug, unitId: pendingAction.record.id }).unwrap();
        showToast({ title: "Organization unit deleted", tone: "success" });
      }
      setPendingAction(null);
    } catch (error) {
      showToast({ title: "Action failed", description: normalizeApiError(error).message, tone: "error" });
    }
  };

  return (
    <section className="rounded-lg border border-border bg-surface">
      <header className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Organization units</h2>
          <p className="mt-1 text-sm text-muted-foreground">Company hierarchy used for assignments and future access scopes.</p>
        </div>
        <Button onClick={() => setDrawer({ mode: "create" })} type="button">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add unit
        </Button>
      </header>

      {isError ? <ErrorState title="Organization units could not load" /> : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-5 py-3 font-semibold">Type</th>
              <th className="px-5 py-3 font-semibold">Parent</th>
              <th className="px-5 py-3 font-semibold">Primary location</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          {showTableSkeleton ? (
            <OrganizationTableSkeleton columns={6} />
          ) : (
            <tbody className="divide-y divide-border">
              {paginated.items.map((record) => (
                <tr key={record.id}>
                  <td className="px-5 py-4">
                    <div className="font-medium">{record.name}</div>
                    <div className="text-xs text-muted-foreground">{[record.key, record.code].filter(Boolean).join(" | ")}</div>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{record.type?.name ?? record.typeId}</td>
                  <td className="px-5 py-4 text-muted-foreground">{record.parent?.name ?? "None"}</td>
                  <td className="px-5 py-4 text-muted-foreground">{record.primaryLocation?.name ?? "None"}</td>
                  <td className="px-5 py-4">
                    <Badge tone={record.status === "ACTIVE" ? "green" : "gray"}>{record.status}</Badge>
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
                        <>
                          <Button
                            aria-label={`Reactivate ${record.name}`}
                            className="h-8 w-8 px-0"
                            onClick={() => setPendingAction({ action: "reactivate", record })}
                            type="button"
                            variant="secondary"
                          >
                            <RotateCcw className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            aria-label={`Delete ${record.name}`}
                            className="h-8 w-8 px-0"
                            onClick={() => setPendingAction({ action: "delete", record })}
                            type="button"
                            variant="secondary"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </>
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

      {!showTableSkeleton && sortedUnits.length === 0 ? (
        <div className="border-t border-border px-5 py-10 text-center">
          <p className="font-medium">No organization units exist.</p>
        </div>
      ) : null}

      {sortedUnits.length > ORGANIZATION_PAGE_SIZE ? (
        <footer className="flex items-center justify-between border-t border-border px-5 py-3 text-sm">
          <span className="text-muted-foreground">
            Page {paginated.page} of {paginated.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              disabled={paginated.page === 1}
              onClick={() => setPage((current) => current - 1)}
              variant="secondary"
            >
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

      <OrganizationUnitDrawer
        drawer={drawer}
        locations={locations}
        isOptionsLoading={isDrawerOptionsLoading}
        onClose={() => setDrawer(null)}
        tenantSlug={tenantSlug}
        types={types}
        units={sortedUnits}
      />

      <ConfirmDialog
        confirmLabel={
          pendingAction?.action === "archive"
            ? "Archive"
            : pendingAction?.action === "delete"
              ? "Delete permanently"
              : "Reactivate"
        }
        description={
          pendingAction?.action === "delete"
            ? "This permanently deletes the archived unit. It is only allowed when no child units, job assignments, or operational history use it."
            : "Archive is blocked when the unit has active children or current job assignments."
        }
        isOpen={Boolean(pendingAction)}
        isWorking={archiveState.isLoading || deleteState.isLoading || reactivateState.isLoading}
        onCancel={() => setPendingAction(null)}
        onConfirm={onConfirmAction}
        title={
          pendingAction?.action === "archive"
            ? "Archive organization unit"
            : pendingAction?.action === "delete"
              ? "Delete organization unit permanently"
              : "Reactivate organization unit"
        }
      />
    </section>
  );
}

function OrganizationUnitDrawer({
  drawer,
  isOptionsLoading,
  locations,
  onClose,
  tenantSlug,
  types,
  units
}: Readonly<{
  drawer: DrawerState | null;
  isOptionsLoading: boolean;
  locations: readonly OrganizationRecord[];
  onClose: () => void;
  tenantSlug: string;
  types: readonly OrganizationUnitType[];
  units: readonly OrganizationUnit[];
}>) {
  const { showToast } = useToast();
  const [createUnit, createState] = useCreateOrganizationUnitMutation();
  const [updateUnit, updateState] = useUpdateOrganizationUnitMutation();
  const [createLocation, createLocationState] = useCreateOrganizationRecordMutation();
  const [formState, setFormState] = useState({
    typeId: "",
    parentOrganizationUnitId: "",
    primaryLocationId: "",
    createPrimaryLocation: false,
    primaryLocationName: "",
    primaryLocationCountry: "US",
    primaryLocationCity: "",
    primaryLocationTimezone: "America/New_York",
    key: "",
    name: "",
    legalName: "",
    code: ""
  });
  const [initialFormState, setInitialFormState] = useState(formState);
  const [formReadyKey, setFormReadyKey] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const drawerKey = drawer ? `${drawer.mode}:${drawer.mode === "edit" ? drawer.record.id : "new"}` : null;
  const activeTypes = useMemo(() => types.filter((type) => type.status === "ACTIVE"), [types]);
  const activeUnits = useMemo(
    () => units.filter((unit) => unit.status === "ACTIVE" && unit.id !== drawer?.record?.id),
    [drawer?.record?.id, units]
  );
  const activeLocations = useMemo(
    () => locations.filter((location) => location.status === "ACTIVE"),
    [locations]
  );

  useEffect(() => {
    if (!drawer) {
      const emptyState = {
        typeId: "",
        parentOrganizationUnitId: "",
        primaryLocationId: "",
        createPrimaryLocation: false,
        primaryLocationName: "",
        primaryLocationCountry: "US",
        primaryLocationCity: "",
        primaryLocationTimezone: "America/New_York",
        key: "",
        name: "",
        legalName: "",
        code: ""
      };
      setFormState(emptyState);
      setInitialFormState(emptyState);
      setFormReadyKey(null);
      return;
    }

    const nextState =
      drawer.mode === "edit"
        ? {
            typeId: drawer.record.typeId,
            parentOrganizationUnitId: drawer.record.parentOrganizationUnitId ?? "",
            primaryLocationId: drawer.record.primaryLocationId ?? "",
            createPrimaryLocation: false,
            primaryLocationName: "",
            primaryLocationCountry: "US",
            primaryLocationCity: "",
            primaryLocationTimezone: "America/New_York",
            key: drawer.record.key ?? "",
            name: drawer.record.name,
            legalName: drawer.record.legalName ?? "",
            code: drawer.record.code ?? ""
          }
        : {
            typeId: activeTypes[0]?.id ?? "",
            parentOrganizationUnitId: "",
            primaryLocationId: "",
            createPrimaryLocation: false,
            primaryLocationName: "",
            primaryLocationCountry: "US",
            primaryLocationCity: "",
            primaryLocationTimezone: "America/New_York",
            key: "",
            name: "",
            legalName: "",
            code: ""
          };
    setFormState(nextState);
    setInitialFormState(nextState);
    setFormReadyKey(drawerKey);
    setFormError(null);
  }, [drawer, drawerKey, activeTypes]);

  const isSaving = createState.isLoading || updateState.isLoading || createLocationState.isLoading;
  const isFormReady = Boolean(drawerKey && formReadyKey === drawerKey && !isOptionsLoading);
  const isBaseValid = Boolean(formState.typeId && formState.name.trim());
  const isNewLocationValid =
    !formState.createPrimaryLocation ||
    Boolean(
      formState.primaryLocationName.trim() &&
        formState.primaryLocationCountry.trim() &&
        formState.primaryLocationCity.trim() &&
        formState.primaryLocationTimezone.trim()
    );
  const isFormValid = isBaseValid && isNewLocationValid;
  const isDirty = JSON.stringify(formState) !== JSON.stringify(initialFormState);
  const canSave =
    !isSaving &&
    isFormReady &&
    isFormValid &&
    (drawer?.mode === "edit" ? isDirty : true);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let primaryLocationId = formState.primaryLocationId || null;
    if (!formState.typeId || !formState.name.trim()) {
      setFormError("Type and name are required.");
      return;
    }

    try {
      if (formState.createPrimaryLocation) {
        if (
          !formState.primaryLocationName.trim() ||
          !formState.primaryLocationCountry.trim() ||
          !formState.primaryLocationCity.trim() ||
          !formState.primaryLocationTimezone.trim()
        ) {
          setFormError("New location name, country, city, and timezone are required.");
          return;
        }

        const location = await createLocation({
          kind: "location",
          tenantSlug,
          payload: {
            name: formState.primaryLocationName.trim(),
            country: formState.primaryLocationCountry.trim(),
            city: formState.primaryLocationCity.trim(),
            timezone: formState.primaryLocationTimezone.trim()
          }
        }).unwrap();
        primaryLocationId = location.id;
      }

      const payload: OrganizationUnitPayload = {
        typeId: formState.typeId,
        parentOrganizationUnitId: formState.parentOrganizationUnitId || null,
        primaryLocationId,
        key: formState.key.trim() || null,
        name: formState.name.trim(),
        legalName: formState.legalName.trim() || null,
        code: formState.code.trim() || null
      };

      if (drawer?.mode === "edit") {
        await updateUnit({ tenantSlug, unitId: drawer.record.id, payload }).unwrap();
        showToast({ title: "Organization unit updated", tone: "success" });
      } else {
        await createUnit({ tenantSlug, payload }).unwrap();
        showToast({ title: "Organization unit created", tone: "success" });
      }
      onClose();
    } catch (error) {
      showToast({ title: "Save failed", description: normalizeApiError(error).message, tone: "error" });
    }
  };

  return (
    <SideDrawer
      description="Location is optional and remains separate from the organization hierarchy."
      isOpen={Boolean(drawer)}
      onClose={onClose}
      title={drawer?.mode === "edit" ? "Edit organization unit" : "Add organization unit"}
      footer={
        <>
          <Button disabled={isSaving} onClick={onClose} type="button" variant="secondary">
            Cancel
          </Button>
          <Button disabled={!canSave} form="organization-unit-form" type="submit">
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </>
      }
    >
      <form className="space-y-4" id="organization-unit-form" onSubmit={submit}>
        {!isFormReady ? (
          <DrawerFormSkeleton fields={7} />
        ) : (
          <>
        <label className="block">
          <RequiredLabel required>Type</RequiredLabel>
          <select
            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            onChange={(event) => setFormState((current) => ({ ...current, typeId: event.target.value }))}
            value={formState.typeId}
          >
            <option value="">Select type</option>
            {activeTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <RequiredLabel required>Name</RequiredLabel>
          <Input
            className="mt-1"
            onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
            placeholder="Santa Cruz"
            value={formState.name}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Parent</span>
          <select
            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            onChange={(event) =>
              setFormState((current) => ({ ...current, parentOrganizationUnitId: event.target.value }))
            }
            value={formState.parentOrganizationUnitId}
          >
            <option value="">No parent</option>
            {activeUnits.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </select>
        </label>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              checked={formState.createPrimaryLocation}
              className="h-4 w-4 rounded border-input"
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  createPrimaryLocation: event.target.checked,
                  primaryLocationId: event.target.checked ? "" : current.primaryLocationId
                }))
              }
              type="checkbox"
            />
            Create primary location
          </label>
          {formState.createPrimaryLocation ? (
            <div className="grid gap-3 rounded-md border border-border p-3">
              <label className="block">
                <RequiredLabel required>Location name</RequiredLabel>
                <Input
                  className="mt-1"
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, primaryLocationName: event.target.value }))
                  }
                  placeholder="New York HQ"
                  value={formState.primaryLocationName}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <RequiredLabel required>Country</RequiredLabel>
                  <Input
                    className="mt-1"
                    onChange={(event) =>
                      setFormState((current) => ({ ...current, primaryLocationCountry: event.target.value }))
                    }
                    placeholder="US"
                    value={formState.primaryLocationCountry}
                  />
                </label>
                <label className="block">
                  <RequiredLabel required>City</RequiredLabel>
                  <Input
                    className="mt-1"
                    onChange={(event) =>
                      setFormState((current) => ({ ...current, primaryLocationCity: event.target.value }))
                    }
                    placeholder="New York"
                    value={formState.primaryLocationCity}
                  />
                </label>
              </div>
              <label className="block">
                <RequiredLabel required>Timezone</RequiredLabel>
                <Input
                  className="mt-1"
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, primaryLocationTimezone: event.target.value }))
                  }
                  placeholder="America/New_York"
                  value={formState.primaryLocationTimezone}
                />
              </label>
            </div>
          ) : (
            <label className="block">
              <span className="text-sm font-medium">Primary location</span>
              <select
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                onChange={(event) => setFormState((current) => ({ ...current, primaryLocationId: event.target.value }))}
                value={formState.primaryLocationId}
              >
                <option value="">No primary location</option>
                {activeLocations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <label className="block">
          <span className="text-sm font-medium">Key</span>
          <Input
            className="mt-1"
            onChange={(event) => setFormState((current) => ({ ...current, key: event.target.value }))}
            placeholder="santa_cruz"
            value={formState.key}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Legal name</span>
          <Input
            className="mt-1"
            onChange={(event) => setFormState((current) => ({ ...current, legalName: event.target.value }))}
            value={formState.legalName}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Code</span>
          <Input
            className="mt-1"
            onChange={(event) => setFormState((current) => ({ ...current, code: event.target.value }))}
            placeholder="SCZ"
            value={formState.code}
          />
        </label>
          </>
        )}

        {formError ? <p className="text-sm text-rose-600">{formError}</p> : null}
      </form>
    </SideDrawer>
  );
}
