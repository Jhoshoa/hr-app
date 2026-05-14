import React, { type ReactNode } from "react";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/navigation/breadcrumbs";

interface PageHeaderProps {
  readonly title: string;
  readonly description: string;
  readonly actions?: ReactNode;
  readonly breadcrumbs?: readonly BreadcrumbItem[];
}

export function PageHeader({ actions, breadcrumbs, description, title }: PageHeaderProps) {
  return (
    <div className="mb-6 space-y-3">
      {breadcrumbs?.length ? <Breadcrumbs items={breadcrumbs} /> : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">{title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
