"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/app-shell/page-header";
import { cn } from "@/lib/utils";
import { organizationCatalogs } from "../organization-config";
import { OrganizationCatalogPanel } from "./organization-catalog-panel";
import type { OrganizationCatalogConfig, OrganizationRecordKind } from "../organization-types";

const hrCatalogKinds: readonly OrganizationRecordKind[] = [
  "department",
  "jobTitle",
  "employmentType",
  "workMode",
  "clientProject"
];

const hrCatalogs = organizationCatalogs.filter((catalog) =>
  hrCatalogKinds.includes(catalog.kind)
);

const defaultCatalog = hrCatalogs[0] as OrganizationCatalogConfig;

export function HrCatalogSettingsPage() {
  const [activeTab, setActiveTab] = useState<OrganizationRecordKind>(defaultCatalog.kind);
  const activeCatalog = useMemo(
    () => hrCatalogs.find((catalog) => catalog.kind === activeTab) ?? defaultCatalog,
    [activeTab]
  );

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Settings", href: "/settings" },
          { label: "HR catalogs" }
        ]}
        title="HR catalogs"
        description="Configure employee assignment catalogs used by HR workflows, reporting, and employee records."
      />

      <div className="flex flex-wrap gap-2 border-b border-border">
        {hrCatalogs.map((catalog) => (
          <button
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              activeTab === catalog.kind
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            key={catalog.kind}
            onClick={() => setActiveTab(catalog.kind)}
            type="button"
          >
            {catalog.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        <OrganizationCatalogPanel catalog={activeCatalog} />
      </div>
    </>
  );
}
