import { PageHeader } from "@/components/app-shell/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function PlatformCompanySignupsPage() {
  return (
    <section>
      <PageHeader
        title="Company signups"
        description="Review pending company requests and approve tenant provisioning."
      />

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <div className="grid grid-cols-12 gap-4 border-b border-border px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
          <span className="col-span-4">Company</span>
          <span className="col-span-3">Admin</span>
          <span className="col-span-2">Status</span>
          <span className="col-span-3 text-right">Submitted</span>
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }, (_, index) => (
            <div className="grid grid-cols-12 gap-4 px-4 py-4" key={index}>
              <div className="col-span-4 space-y-2">
                <Skeleton className="h-4 w-44 max-w-full" />
                <Skeleton className="h-3 w-28 max-w-full" />
              </div>
              <div className="col-span-3 space-y-2">
                <Skeleton className="h-4 w-36 max-w-full" />
                <Skeleton className="h-3 w-48 max-w-full" />
              </div>
              <div className="col-span-2">
                <Skeleton className="h-6 w-20" />
              </div>
              <div className="col-span-3 flex justify-end">
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
