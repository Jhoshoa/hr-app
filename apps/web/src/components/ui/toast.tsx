"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";

interface ToastInput {
  readonly title: string;
  readonly description?: string;
  readonly tone?: ToastTone;
}

interface Toast extends ToastInput {
  readonly id: string;
}

interface ToastContextValue {
  readonly showToast: (toast: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const toneStyles: Record<ToastTone, string> = {
  error: "border-rose-200 bg-rose-50 text-rose-900",
  info: "border-sky-200 bg-sky-50 text-sky-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900"
};

const toneIcons = {
  error: XCircle,
  info: Info,
  success: CheckCircle2
};

export function ToastProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ tone = "info", ...toast }: ToastInput) => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { ...toast, id, tone }]);
      window.setTimeout(() => dismissToast(id), 4000);
    },
    [dismissToast]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-50 w-[min(24rem,calc(100vw-2rem))] space-y-3">
        {toasts.map((toast) => {
          const tone = toast.tone ?? "info";
          const Icon = toneIcons[tone];

          return (
            <div
              className={cn("flex gap-3 rounded-lg border p-4 shadow-lg", toneStyles[tone])}
              key={toast.id}
              role="status"
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description ? <p className="mt-1 text-sm opacity-80">{toast.description}</p> : null}
              </div>
              <button
                aria-label="Dismiss notification"
                className="rounded-md p-1 hover:bg-black/5"
                onClick={() => dismissToast(toast.id)}
                type="button"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider.");
  }

  return context;
};
