import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "green" | "gray" | "red" | "blue" | "amber";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  readonly tone?: BadgeTone;
}

const tones: Record<BadgeTone, string> = {
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  blue: "border-sky-200 bg-sky-50 text-sky-700",
  gray: "border-slate-200 bg-slate-50 text-slate-600",
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  red: "border-rose-200 bg-rose-50 text-rose-700"
};

export function Badge({ className, tone = "gray", ...props }: BadgeProps) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", tones[tone], className)}
      {...props}
    />
  );
}
