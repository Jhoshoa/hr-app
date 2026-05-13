import type { ReactNode } from "react";

interface EmptyStateProps {
  readonly title: string;
  readonly description: string;
  readonly action?: ReactNode;
}

export function EmptyState({ action, description, title }: EmptyStateProps) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface p-8 text-center">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
