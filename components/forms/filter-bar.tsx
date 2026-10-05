"use client";

import { Download, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/input";
import { downloadCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";

export interface FilterDef {
  key: string;
  label: string;
  options: { id: string; name: string }[];
}

/** Report dimension filters, kept in the URL so reports are shareable and server-rendered. */
export function FilterBar({ filters, className }: { filters: FilterDef[]; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const active = filters.filter((f) => params.get(f.key));

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    start(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  const clear = () => {
    const next = new URLSearchParams(params.toString());
    for (const f of filters) next.delete(f.key);
    start(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", pending && "opacity-70", className)}>
      {filters.map((f) => (
        <NativeSelect key={f.key} aria-label={f.label} value={params.get(f.key) ?? ""} onChange={(e) => set(f.key, e.target.value)} className={cn("w-auto min-w-36", params.get(f.key) && "border-primary/50 bg-primary-soft text-primary-soft-fg")}>
          <option value="">All {f.label.toLowerCase()}</option>
          {f.options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </NativeSelect>
      ))}
      {active.length > 0 && (
        <Button variant="ghost" size="sm" onClick={clear}>
          <X /> Clear filters
        </Button>
      )}
    </div>
  );
}

export function ExportButton({ filename, rows, label = "Export CSV" }: { filename: string; rows: Record<string, string | number | null>[]; label?: string }) {
  return (
    <Button variant="secondary" size="sm" disabled={rows.length === 0} onClick={() => downloadCsv(filename, rows)}>
      <Download /> {label}
    </Button>
  );
}
