"use client";

import { BriefcaseBusiness, Plus, Search } from "lucide-react";
import React from "react";
import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { PageHeader } from "@/components/app-shell/page-header";
import { EmptyState } from "@/components/data-display/empty-state";
import { ErrorState } from "@/components/data-display/error-state";
import { EmployeeStatusBadge } from "@/components/data-display/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SideDrawer } from "@/components/ui/side-drawer";
import { useToast } from "@/components/ui/toast";
import {
  useAddEmployeeJobAssignmentMutation,
  useListEmployeesQuery
} from "@/features/employees/employees-api";
import { useListOrganizationRecordsQuery } from "@/features/organization/organization-api";
import { useListOrganizationUnitsQuery } from "@/features/organization/organization-units-api";
import { useCurrentTenant } from "@/hooks/use-current-tenant";
import { formatShortDate } from "@/lib/format/date";
import type { EmployeeListItem } from "@/types/employees";

type AssignmentDrawerState = { readonly employee: EmployeeListItem } | null;

export default function EmployeesPage() {
  const currentTenant = useCurrentTenant();
  const tenantSlug = currentTenant.tenantSlug;
  const [search, setSearch] = useState("");
  const [organizationUnitId, setOrganizationUnitId] = useState("");
  const [assignmentDrawer, setAssignmentDrawer] = useState<AssignmentDrawerState>(null);
  const { data = [], isError, isLoading } = useListEmployeesQuery({
    search,
    organizationUnitId: organizationUnitId || undefined
  });
  const { data: organizationUnits = [] } = useListOrganizationUnitsQuery(
    { tenantSlug },
    { skip: !tenantSlug }
  );
  const { data: departments = [] } = useListOrganizationRecordsQuery(
    { kind: "department", tenantSlug },
    { skip: !tenantSlug }
  );
  const { data: jobTitles = [] } = useListOrganizationRecordsQuery(
    { kind: "jobTitle", tenantSlug },
    { skip: !tenantSlug }
  );
  const { data: locations = [] } = useListOrganizationRecordsQuery(
    { kind: "location", tenantSlug },
    { skip: !tenantSlug }
  );
  const { data: employmentTypes = [] } = useListOrganizationRecordsQuery(
    { kind: "employmentType", tenantSlug },
    { skip: !tenantSlug }
  );
  const { data: workModes = [] } = useListOrganizationRecordsQuery(
    { kind: "workMode", tenantSlug },
    { skip: !tenantSlug }
  );

  const activeOrganizationUnits = useMemo(
    () => organizationUnits.filter((unit) => unit.status === "ACTIVE"),
    [organizationUnits]
  );
  const activeDepartments = useMemo(() => departments.filter((record) => record.status === "ACTIVE"), [departments]);
  const activeJobTitles = useMemo(() => jobTitles.filter((record) => record.status === "ACTIVE"), [jobTitles]);
  const activeLocations = useMemo(() => locations.filter((record) => record.status === "ACTIVE"), [locations]);
  const activeEmploymentTypes = useMemo(
    () => employmentTypes.filter((record) => record.status === "ACTIVE"),
    [employmentTypes]
  );
  const activeWorkModes = useMemo(() => workModes.filter((record) => record.status === "ACTIVE"), [workModes]);
  const organizationUnitNameById = useMemo(
    () => new Map(organizationUnits.map((unit) => [unit.id, unit.name])),
    [organizationUnits]
  );
  const departmentNameById = useMemo(
    () => new Map(departments.map((department) => [department.id, department.name])),
    [departments]
  );
  const jobTitleNameById = useMemo(
    () => new Map(jobTitles.map((jobTitle) => [jobTitle.id, jobTitle.name])),
    [jobTitles]
  );
  const locationNameById = useMemo(
    () => new Map(locations.map((location) => [location.id, location.name])),
    [locations]
  );
  const employees = data;

  return (
    <>
      <PageHeader
        actions={
          <Button>
            <Plus size={16} aria-hidden="true" />
            New employee
          </Button>
        }
        title="Employees"
        description="Core employee database with status, job, department, location, and manager context."
      />

      <Card className="mb-4 p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_280px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              className="pl-9"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search employees"
              value={search}
            />
          </div>
          <select
            aria-label="Filter by organization unit"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            onChange={(event) => setOrganizationUnitId(event.target.value)}
            value={organizationUnitId}
          >
            <option value="">All organization units</option>
            {activeOrganizationUnits.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {isError ? <ErrorState title="Employees could not load" /> : null}

      {!isError && employees.length === 0 && !isLoading ? (
        <EmptyState
          title="No employees found"
          description="Adjust the search or add a new employee when the create flow is available."
        />
      ) : null}

      {employees.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="border-b border-border bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Employee</th>
                  <th className="px-4 py-3 font-semibold">Job</th>
                  <th className="px-4 py-3 font-semibold">Organization</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">Manager</th>
                  <th className="px-4 py-3 font-semibold">Start date</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {employees.map((employee) => (
                  <tr className="bg-surface hover:bg-muted/50" key={employee.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{employee.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {employee.employeeNumber} · {employee.workEmail}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{employee.jobTitleId ? jobTitleNameById.get(employee.jobTitleId) ?? "Not assigned" : "Not assigned"}</p>
                      <p className="text-xs text-muted-foreground">
                        {employee.departmentId ? departmentNameById.get(employee.departmentId) ?? "Not assigned" : "Not assigned"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {employee.organizationUnitId
                        ? organizationUnitNameById.get(employee.organizationUnitId) ?? "Not assigned"
                        : "Not assigned"}
                    </td>
                    <td className="px-4 py-3">
                      {employee.locationId ? locationNameById.get(employee.locationId) ?? "Not assigned" : "Not assigned"}
                    </td>
                    <td className="px-4 py-3">{employee.manager}</td>
                    <td className="px-4 py-3">{formatShortDate(employee.startDate)}</td>
                    <td className="px-4 py-3">
                      <EmployeeStatusBadge status={employee.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Button
                          aria-label={`Add job assignment for ${employee.name}`}
                          className="h-8 w-8 px-0"
                          onClick={() => setAssignmentDrawer({ employee })}
                          type="button"
                          variant="secondary"
                        >
                          <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      <JobAssignmentDrawer
        departments={activeDepartments}
        drawer={assignmentDrawer}
        employmentTypes={activeEmploymentTypes}
        jobTitles={activeJobTitles}
        locations={activeLocations}
        onClose={() => setAssignmentDrawer(null)}
        organizationUnits={activeOrganizationUnits}
        workModes={activeWorkModes}
      />
    </>
  );
}

function JobAssignmentDrawer({
  departments,
  drawer,
  employmentTypes,
  jobTitles,
  locations,
  onClose,
  organizationUnits,
  workModes
}: Readonly<{
  departments: readonly { id: string; name: string }[];
  drawer: AssignmentDrawerState;
  employmentTypes: readonly { id: string; name: string }[];
  jobTitles: readonly { id: string; name: string }[];
  locations: readonly { id: string; name: string }[];
  onClose: () => void;
  organizationUnits: readonly { id: string; name: string }[];
  workModes: readonly { id: string; name: string }[];
}>) {
  const { showToast } = useToast();
  const [addAssignment, addAssignmentState] = useAddEmployeeJobAssignmentMutation();
  const [formState, setFormState] = useState({
    departmentId: "",
    jobTitleId: "",
    locationId: "",
    organizationUnitId: "",
    employmentTypeId: "",
    workModeId: "",
    effectiveFrom: new Date().toISOString().slice(0, 10),
    effectiveTo: ""
  });
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!drawer) {
      return;
    }

    const currentAssignment = drawer.employee.jobAssignments?.[0];
    setFormState({
      departmentId: currentAssignment?.departmentId ?? "",
      jobTitleId: currentAssignment?.jobTitleId ?? "",
      locationId: currentAssignment?.locationId ?? "",
      organizationUnitId: currentAssignment?.organizationUnitId ?? "",
      employmentTypeId: currentAssignment?.employmentTypeId ?? "",
      workModeId: currentAssignment?.workModeId ?? "",
      effectiveFrom: new Date().toISOString().slice(0, 10),
      effectiveTo: ""
    });
    setFormError(null);
  }, [drawer]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!drawer) {
      return;
    }

    if (!formState.effectiveFrom) {
      setFormError("Effective from is required.");
      return;
    }

    try {
      await addAssignment({
        employeeId: drawer.employee.id,
        payload: {
          departmentId: formState.departmentId || undefined,
          jobTitleId: formState.jobTitleId || undefined,
          locationId: formState.locationId || undefined,
          organizationUnitId: formState.organizationUnitId || undefined,
          employmentTypeId: formState.employmentTypeId || undefined,
          workModeId: formState.workModeId || undefined,
          effectiveFrom: `${formState.effectiveFrom}T00:00:00.000Z`,
          effectiveTo: formState.effectiveTo ? `${formState.effectiveTo}T00:00:00.000Z` : undefined
        }
      }).unwrap();
      showToast({ title: "Job assignment added", tone: "success" });
      setFormError(null);
      onClose();
    } catch {
      showToast({ title: "Assignment failed", description: "Review the selected job values and try again.", tone: "error" });
    }
  };

  const updateField = (key: keyof typeof formState) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormState((current) => ({ ...current, [key]: event.target.value }));
  };

  return (
    <SideDrawer
      description={drawer?.employee.name ?? ""}
      isOpen={Boolean(drawer)}
      onClose={onClose}
      title="Add job assignment"
    >
      <form className="space-y-4" onSubmit={submit}>
        <SelectField label="Organization unit" onChange={updateField("organizationUnitId")} options={organizationUnits} value={formState.organizationUnitId} />
        <SelectField label="Department" onChange={updateField("departmentId")} options={departments} value={formState.departmentId} />
        <SelectField label="Job title" onChange={updateField("jobTitleId")} options={jobTitles} value={formState.jobTitleId} />
        <SelectField label="Location" onChange={updateField("locationId")} options={locations} value={formState.locationId} />
        <SelectField label="Employment type" onChange={updateField("employmentTypeId")} options={employmentTypes} value={formState.employmentTypeId} />
        <SelectField label="Work mode" onChange={updateField("workModeId")} options={workModes} value={formState.workModeId} />

        <label className="block">
          <span className="text-sm font-medium">Effective from</span>
          <Input className="mt-1" onChange={updateField("effectiveFrom")} type="date" value={formState.effectiveFrom} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Effective to</span>
          <Input className="mt-1" onChange={updateField("effectiveTo")} type="date" value={formState.effectiveTo} />
        </label>

        {formError ? <p className="text-sm text-rose-600">{formError}</p> : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button disabled={addAssignmentState.isLoading} onClick={onClose} type="button" variant="secondary">
            Cancel
          </Button>
          <Button disabled={addAssignmentState.isLoading} type="submit">
            {addAssignmentState.isLoading ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </SideDrawer>
  );
}

function SelectField({
  label,
  onChange,
  options,
  value
}: Readonly<{
  label: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  options: readonly { id: string; name: string }[];
  value: string;
}>) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <select
        className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        onChange={onChange}
        value={value}
      >
        <option value="">Not assigned</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}
