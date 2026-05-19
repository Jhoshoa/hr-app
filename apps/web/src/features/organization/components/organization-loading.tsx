"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function RequiredLabel({ children, required }: Readonly<{ children: React.ReactNode; required?: boolean }>) {
  return (
    <span className="text-sm font-medium">
      {children}
      {required ? <span className="ml-1 text-foreground">*</span> : null}
    </span>
  );
}

export function OrganizationTableSkeleton({
  columns,
  rows = 4
}: Readonly<{
  columns: number;
  rows?: number;
}>) {
  return (
    <tbody className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <td className="px-5 py-4" key={columnIndex}>
              <Skeleton
                className={
                  columnIndex === columns - 1
                    ? "ml-auto h-8 w-20"
                    : columnIndex === 0
                      ? "h-5 w-40"
                      : "h-5 w-28"
                }
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

export function DrawerFormSkeleton({ fields = 5 }: Readonly<{ fields?: number }>) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index}>
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-2 h-10 w-full" />
        </div>
      ))}
    </div>
  );
}
