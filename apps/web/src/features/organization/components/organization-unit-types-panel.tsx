"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Archive, Edit3, GripVertical, Plus, RotateCcw, Save } from "lucide-react";
import { ErrorState } from "@/components/data-display/error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { SideDrawer } from "@/components/ui/side-drawer";
import { useToast } from "@/components/ui/toast";
import { useCurrentTenant } from "@/hooks/use-current-tenant";
import { normalizeApiError } from "@/lib/api/api-error";
import { DrawerFormSkeleton, OrganizationTableSkeleton, RequiredLabel } from "./organization-loading";
import {
  useArchiveOrganizationUnitTypeMutation,
  useCreateOrganizationUnitTypeMutation,
  useListOrganizationUnitTypesQuery,
  useReorderOrganizationUnitTypesMutation,
  useReactivateOrganizationUnitTypeMutation,
  useUpdateOrganizationUnitTypeMutation
} from "../organization-units-api";
import type { OrganizationUnitType, OrganizationUnitTypePayload } from "../organization-units-types";

type DrawerState =
  | { readonly mode: "create"; readonly record?: undefined }
  | { readonly mode: "edit"; readonly record: OrganizationUnitType };

interface PendingAction {
  readonly action: "archive" | "reactivate";
  readonly record: OrganizationUnitType;
}

export function OrganizationUnitTypesPanel() {
  const { showToast } = useToast();
  const currentTenant = useCurrentTenant();
  const tenantSlug = currentTenant.tenantSlug;
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isReorderConfirmOpen, setIsReorderConfirmOpen] = useState(false);
  const [orderedTypeIds, setOrderedTypeIds] = useState<string[]>([]);
  const [draggingTypeId, setDraggingTypeId] = useState<string | null>(null);
  const serverTypeIdsRef = useRef<string[]>([]);
  const { data = [], isError, isFetching, isLoading } = useListOrganizationUnitTypesQuery(
    { tenantSlug },
    { skip: !tenantSlug }
  );
  const [archiveType, archiveState] = useArchiveOrganizationUnitTypeMutation();
  const [reactivateType, reactivateState] = useReactivateOrganizationUnitTypeMutation();
  const [reorderTypes, reorderState] = useReorderOrganizationUnitTypesMutation();

  const sortedTypes = useMemo(
    () => [...data].sort((first, second) => first.sortOrder - second.sortOrder || first.name.localeCompare(second.name)),
    [data]
  );
  const sortedTypeIds = useMemo(() => sortedTypes.map((type) => type.id), [sortedTypes]);
  const visibleTypes = useMemo(() => {
    const typeById = new Map(sortedTypes.map((type) => [type.id, type]));
    const orderedTypes = orderedTypeIds.flatMap((typeId) => {
      const type = typeById.get(typeId);
      return type ? [type] : [];
    });

    return orderedTypes.length === sortedTypes.length ? orderedTypes : sortedTypes;
  }, [orderedTypeIds, sortedTypes]);
  const hasOrderChanges =
    orderedTypeIds.length === sortedTypeIds.length &&
    orderedTypeIds.some((typeId, index) => typeId !== sortedTypeIds[index]);
  const showTableSkeleton = isLoading || (isFetching && sortedTypes.length === 0);

  useEffect(() => {
    const hasServerOrderChanged =
      serverTypeIdsRef.current.length !== sortedTypeIds.length ||
      serverTypeIdsRef.current.some((typeId, index) => typeId !== sortedTypeIds[index]);

    if (!hasServerOrderChanged) {
      return;
    }

    serverTypeIdsRef.current = sortedTypeIds;
    setOrderedTypeIds(sortedTypeIds);
  }, [sortedTypeIds]);

  const moveType = (sourceTypeId: string, targetTypeId: string) => {
    if (sourceTypeId === targetTypeId) {
      return;
    }

    setOrderedTypeIds((current) => {
      const nextOrder = current.length === sortedTypeIds.length ? [...current] : [...sortedTypeIds];
      const sourceIndex = nextOrder.indexOf(sourceTypeId);
      const targetIndex = nextOrder.indexOf(targetTypeId);

      if (sourceIndex === -1 || targetIndex === -1) {
        return current;
      }

      const [movedTypeId] = nextOrder.splice(sourceIndex, 1);
      if (!movedTypeId) {
        return current;
      }
      nextOrder.splice(targetIndex, 0, movedTypeId);

      return nextOrder;
    });
  };

  const moveTypeByOffset = (sourceTypeId: string, offset: -1 | 1) => {
    setOrderedTypeIds((current) => {
      const nextOrder = current.length === sortedTypeIds.length ? [...current] : [...sortedTypeIds];
      const sourceIndex = nextOrder.indexOf(sourceTypeId);
      const targetIndex = sourceIndex + offset;

      if (sourceIndex === -1 || targetIndex < 0 || targetIndex >= nextOrder.length) {
        return current;
      }

      const [movedTypeId] = nextOrder.splice(sourceIndex, 1);
      if (!movedTypeId) {
        return current;
      }
      nextOrder.splice(targetIndex, 0, movedTypeId);

      return nextOrder;
    });
  };

  const saveOrder = async () => {
    const uniqueTypeIds = new Set(orderedTypeIds);

    if (uniqueTypeIds.size !== orderedTypeIds.length || orderedTypeIds.length !== sortedTypes.length) {
      setIsReorderConfirmOpen(false);
      showToast({ title: "Order is invalid", description: "Reload the page and try again.", tone: "error" });
      return;
    }

    try {
      await reorderTypes({ tenantSlug, typeIds: orderedTypeIds }).unwrap();
      setIsReorderConfirmOpen(false);
      showToast({ title: "Organization unit type order saved", tone: "success" });
    } catch {
      showToast({ title: "Save order failed", description: "The type order could not be updated.", tone: "error" });
    }
  };

  const onConfirmAction = async () => {
    if (!pendingAction) {
      return;
    }

    try {
      if (pendingAction.action === "archive") {
        await archiveType({ tenantSlug, typeId: pendingAction.record.id }).unwrap();
        showToast({ title: "Organization unit type archived", tone: "success" });
      } else {
        await reactivateType({ tenantSlug, typeId: pendingAction.record.id }).unwrap();
        showToast({ title: "Organization unit type reactivated", tone: "success" });
      }
      setPendingAction(null);
    } catch {
      showToast({ title: "Action failed", description: "The type could not be updated.", tone: "error" });
    }
  };

  return (
    <section className="rounded-lg border border-border bg-surface">
      <header className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Organization unit types</h2>
          <p className="mt-1 text-sm text-muted-foreground">Configurable labels for company hierarchy levels.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={!hasOrderChanges || reorderState.isLoading}
            onClick={() => setIsReorderConfirmOpen(true)}
            type="button"
            variant="secondary"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {reorderState.isLoading ? "Saving..." : "Save order"}
          </Button>
          <Button onClick={() => setDrawer({ mode: "create" })} type="button">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add type
          </Button>
        </div>
      </header>

      {isError ? <ErrorState title="Organization unit types could not load" /> : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="w-12 px-5 py-3 font-semibold" aria-label="Reorder" />
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-5 py-3 font-semibold">Key</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          {showTableSkeleton ? (
            <OrganizationTableSkeleton columns={5} />
          ) : (
            <tbody className="divide-y divide-border">
              {visibleTypes.map((record) => (
                <tr
                  draggable
                  key={record.id}
                  onDragEnd={() => setDraggingTypeId(null)}
                  onDragOver={(event) => {
                    event.preventDefault();
                    if (draggingTypeId) {
                      moveType(draggingTypeId, record.id);
                    }
                  }}
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", record.id);
                    setDraggingTypeId(record.id);
                  }}
                >
                  <td className="px-5 py-4">
                    <button
                      aria-label={`Reorder ${record.name}`}
                      className="inline-flex h-8 w-8 cursor-grab items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
                      onKeyDown={(event) => {
                        if (event.key === "ArrowUp") {
                          event.preventDefault();
                          moveTypeByOffset(record.id, -1);
                        }
                        if (event.key === "ArrowDown") {
                          event.preventDefault();
                          moveTypeByOffset(record.id, 1);
                        }
                      }}
                      type="button"
                    >
                      <GripVertical className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </td>
                  <td className="px-5 py-4 font-medium">{record.name}</td>
                  <td className="px-5 py-4 text-muted-foreground">{record.key}</td>
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

      {!showTableSkeleton && sortedTypes.length === 0 ? (
        <div className="border-t border-border px-5 py-10 text-center">
          <p className="font-medium">No organization unit types exist.</p>
        </div>
      ) : null}

      <OrganizationUnitTypeDrawer
        drawer={drawer}
        onClose={() => setDrawer(null)}
        tenantSlug={tenantSlug}
      />

      <ConfirmDialog
        confirmLabel={pendingAction?.action === "archive" ? "Archive" : "Reactivate"}
        description="This updates whether the type is available for active organization units."
        isOpen={Boolean(pendingAction)}
        isWorking={archiveState.isLoading || reactivateState.isLoading}
        onCancel={() => setPendingAction(null)}
        onConfirm={onConfirmAction}
        title={pendingAction?.action === "archive" ? "Archive type" : "Reactivate type"}
      />
      <ConfirmDialog
        confirmLabel="Save order"
        description="This will update the order of organization unit types for this tenant."
        isOpen={isReorderConfirmOpen}
        isWorking={reorderState.isLoading}
        onCancel={() => setIsReorderConfirmOpen(false)}
        onConfirm={saveOrder}
        title="Save type order"
      />
    </section>
  );
}

function OrganizationUnitTypeDrawer({
  drawer,
  onClose,
  tenantSlug
}: Readonly<{
  drawer: DrawerState | null;
  onClose: () => void;
  tenantSlug: string;
}>) {
  const { showToast } = useToast();
  const [createType, createState] = useCreateOrganizationUnitTypeMutation();
  const [updateType, updateState] = useUpdateOrganizationUnitTypeMutation();
  const [formState, setFormState] = useState({ key: "", name: "" });
  const [initialFormState, setInitialFormState] = useState({ key: "", name: "" });
  const [formReadyKey, setFormReadyKey] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const drawerKey = drawer ? `${drawer.mode}:${drawer.mode === "edit" ? drawer.record.id : "new"}` : null;

  useEffect(() => {
    if (!drawer) {
      const emptyState = { key: "", name: "" };
      setFormState(emptyState);
      setInitialFormState(emptyState);
      setFormReadyKey(null);
      return;
    }

    const nextState =
      drawer.mode === "edit"
        ? {
            key: drawer.record.key,
            name: drawer.record.name
          }
        : { key: "", name: "" };
    setFormState(nextState);
    setInitialFormState(nextState);
    setFormReadyKey(drawerKey);
    setFormError(null);
  }, [drawer, drawerKey]);

  const isSaving = createState.isLoading || updateState.isLoading;
  const isFormReady = Boolean(drawerKey && formReadyKey === drawerKey);
  const isFormValid = Boolean(formState.key.trim() && formState.name.trim());
  const isDirty = JSON.stringify(formState) !== JSON.stringify(initialFormState);
  const canSave =
    !isSaving &&
    isFormReady &&
    isFormValid &&
    (drawer?.mode === "edit" ? isDirty : true);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: OrganizationUnitTypePayload = {
      key: formState.key.trim(),
      name: formState.name.trim()
    };

    if (!payload.key || !payload.name) {
      setFormError("Key and name are required.");
      return;
    }

    try {
      if (drawer?.mode === "edit") {
        await updateType({ tenantSlug, typeId: drawer.record.id, payload }).unwrap();
        showToast({ title: "Organization unit type updated", tone: "success" });
      } else {
        await createType({ tenantSlug, payload }).unwrap();
        showToast({ title: "Organization unit type created", tone: "success" });
      }
      onClose();
    } catch (error) {
      showToast({ title: "Save failed", description: normalizeApiError(error).message, tone: "error" });
    }
  };

  return (
    <SideDrawer
      description="Keys must be lowercase snake_case and stable for integrations."
      isOpen={Boolean(drawer)}
      onClose={onClose}
      title={drawer?.mode === "edit" ? "Edit organization unit type" : "Add organization unit type"}
      footer={
        <>
          <Button disabled={isSaving} onClick={onClose} type="button" variant="secondary">
            Cancel
          </Button>
          <Button disabled={!canSave} form="organization-unit-type-form" type="submit">
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </>
      }
    >
      <form className="space-y-4" id="organization-unit-type-form" onSubmit={submit}>
        {!isFormReady ? (
          <DrawerFormSkeleton fields={2} />
        ) : (
          <>
            <label className="block">
              <RequiredLabel required>Key</RequiredLabel>
              <Input
                className="mt-1"
                onChange={(event) => setFormState((current) => ({ ...current, key: event.target.value }))}
                placeholder="branch"
                value={formState.key}
              />
            </label>
            <label className="block">
              <RequiredLabel required>Name</RequiredLabel>
              <Input
                className="mt-1"
                onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
                placeholder="Branch"
                value={formState.name}
              />
            </label>
          </>
        )}

        {formError ? <p className="text-sm text-rose-600">{formError}</p> : null}
      </form>
    </SideDrawer>
  );
}
