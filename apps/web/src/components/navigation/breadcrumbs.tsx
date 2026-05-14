import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  readonly label: string;
  readonly href?: string;
}

interface BreadcrumbsProps {
  readonly className?: string;
  readonly items: readonly BreadcrumbItem[];
}

export function Breadcrumbs({ className, items }: BreadcrumbsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0 text-sm", className)}>
      <ol className="flex min-w-0 flex-wrap items-center gap-1 text-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li className="flex min-w-0 items-center gap-1" key={`${item.label}-${index}`}>
              {item.href && !isLast ? (
                <Link
                  className="min-w-0 truncate rounded-sm underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
                  href={item.href}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={cn("min-w-0 truncate", isLast && "font-medium text-foreground")}
                >
                  {item.label}
                </span>
              )}

              {!isLast ? <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
