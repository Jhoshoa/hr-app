import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MetricCardProps {
  readonly icon: LucideIcon;
  readonly label: string;
  readonly value: string;
  readonly detail: string;
}

export function MetricCard({ detail, icon: Icon, label, value }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        </div>
        <div className="rounded-md bg-muted p-2 text-primary">
          <Icon size={20} aria-hidden="true" />
        </div>
      </CardContent>
    </Card>
  );
}
