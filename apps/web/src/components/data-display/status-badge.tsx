import { Badge } from "@/components/ui/badge";
import type { EmployeeStatus } from "@/types/employees";

export function EmployeeStatusBadge({ status }: Readonly<{ status: EmployeeStatus }>) {
  const config = {
    ACTIVE: { label: "Active", tone: "green" as const },
    INACTIVE: { label: "Inactive", tone: "amber" as const },
    TERMINATED: { label: "Terminated", tone: "red" as const }
  }[status];

  return <Badge tone={config.tone}>{config.label}</Badge>;
}
