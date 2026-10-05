import { Skeleton } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

export function MetricsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="bg-surface p-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-7 w-32" />
          <Skeleton className="mt-3 h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ className, height = 260 }: { className?: string; height?: number }) {
  return (
    <div className={cn("rounded-lg border border-border bg-surface p-4", className)}>
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-1.5 h-3 w-64" />
      <div className="mt-6 flex items-end gap-2" style={{ height: height - 80 }}>
        {Array.from({ length: 18 }, (_, i) => (
          <Skeleton key={i} className="flex-1 rounded-sm" style={{ height: `${30 + ((i * 37) % 60)}%` }} />
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 8, columns = 6, className }: { rows?: number; columns?: number; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-lg border border-border bg-surface", className)}>
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="ml-auto h-7 w-24" />
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex items-center gap-6 border-b border-border-subtle px-4 py-3 last:border-0">
          {Array.from({ length: columns }, (_, c) => (
            <Skeleton key={c} className={cn("h-3.5", c === 0 ? "w-48" : "w-20", c > 3 && "hidden md:block")} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton({ variant = "table" }: { variant?: "table" | "dashboard" | "detail" }) {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pt-6 pb-16 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-3 h-8 w-72" />
      <Skeleton className="mt-2.5 h-3.5 w-96 max-w-full" />
      <div className="mt-8 space-y-6">
        <MetricsSkeleton />
        {variant === "dashboard" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <ChartSkeleton className="lg:col-span-2" />
            <ChartSkeleton />
          </div>
        )}
        {variant === "detail" && <ChartSkeleton />}
        <TableSkeleton />
      </div>
    </div>
  );
}
