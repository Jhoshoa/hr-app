"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "./button";

interface ConfirmDialogProps {
  readonly confirmLabel?: string;
  readonly description: string;
  readonly isOpen: boolean;
  readonly isWorking?: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
  readonly title: string;
}

export function ConfirmDialog({
  confirmLabel = "Confirm",
  description,
  isOpen,
  isWorking,
  onCancel,
  onConfirm,
  title
}: ConfirmDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-5 shadow-xl">
        <div className="flex gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button disabled={isWorking} onClick={onCancel} type="button" variant="secondary">
            Cancel
          </Button>
          <Button disabled={isWorking} onClick={onConfirm} type="button">
            {isWorking ? "Saving..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
