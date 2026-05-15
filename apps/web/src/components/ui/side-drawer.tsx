"use client";

import React, { type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "./button";

interface SideDrawerProps {
  readonly children: ReactNode;
  readonly description?: string;
  readonly footer?: ReactNode;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title: string;
}

export function SideDrawer({ children, description, footer, isOpen, onClose, title }: SideDrawerProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40">
      <button
        aria-label="Close drawer"
        className="absolute inset-0 bg-slate-950/35"
        onClick={onClose}
        type="button"
      />
      <section className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-border bg-surface shadow-xl">
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
          </div>
          <Button aria-label="Close drawer" className="h-8 w-8 px-0" onClick={onClose} type="button" variant="ghost">
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer ? (
          <footer className="border-t border-border bg-surface px-5 py-4">
            <div className="flex justify-end gap-2">{footer}</div>
          </footer>
        ) : null}
      </section>
    </div>
  );
}
