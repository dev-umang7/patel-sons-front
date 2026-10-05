"use client";

import { Calendar, Check, ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { DayPicker, type DateRange as PickerRange } from "react-day-picker";
import "react-day-picker/style.css";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/overlays";
import { formatDate } from "@/lib/format";
import { PERIOD_PRESETS, type ResolvedPeriod } from "@/lib/period";
import { cn } from "@/lib/utils";

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fromISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Date range selector. Presets are rows (nobody fights a calendar for "last 30 days");
 * the custom range sits behind a hairline. State lives in the URL.
 */
export function PeriodPicker({ period, asOf, historyStart }: { period: ResolvedPeriod; asOf: string; historyStart: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(period.key === "custom");
  const [range, setRange] = useState<PickerRange | undefined>({ from: fromISO(period.from), to: fromISO(period.to) });
  const [pending, startTransition] = useTransition();

  const navigate = (update: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(params.toString());
    next.delete("period");
    next.delete("from");
    next.delete("to");
    update(next);
    setOpen(false);
    startTransition(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="secondary" size="md" aria-label={`Period: ${period.label}`} className={cn(pending && "opacity-70")}>
          <Calendar />
          <span className="font-medium">{period.key === "custom" ? `${formatDate(period.from)} – ${formatDate(period.to)}` : period.label}</span>
          <span className="hidden text-fg-muted lg:inline">
            · {formatDate(period.from)} – {formatDate(period.to)}
          </span>
          <ChevronDown className="text-fg-muted" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto min-w-64 p-1">
        <ul role="listbox" aria-label="Reporting period">
          {PERIOD_PRESETS.map((p) => {
            const active = period.key === p.key;
            return (
              <li key={p.key} role="option" aria-selected={active}>
                <button type="button" onClick={() => navigate((n) => n.set("period", p.key))} className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-sm hover:bg-surface-hover">
                  <span className="grid w-4 place-items-center">{active && <Check className="size-4 text-primary" strokeWidth={2.5} />}</span>
                  <span className={cn("flex-1 text-left", active && "font-medium")}>{p.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mt-1 border-t border-border-subtle pt-1">
          {!custom ? (
            <button type="button" onClick={() => setCustom(true)} className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-sm text-fg-secondary hover:bg-surface-hover">
              <span className="grid w-4 place-items-center">{period.key === "custom" && <Check className="size-4 text-primary" strokeWidth={2.5} />}</span>
              Custom range…
            </button>
          ) : (
            <div className="ps-calendar p-2">
              <DayPicker
                mode="range"
                selected={range}
                onSelect={setRange}
                defaultMonth={range?.from}
                weekStartsOn={1}
                disabled={{ before: fromISO(historyStart), after: fromISO(asOf) }}
                startMonth={fromISO(historyStart)}
                endMonth={fromISO(asOf)}
              />
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-xs text-fg-muted">{range?.from && range.to ? `${formatDate(toISO(range.from))} – ${formatDate(toISO(range.to))}` : "Select a start and end date"}</span>
                <Button
                  size="sm"
                  variant="primary"
                  disabled={!range?.from || !range.to}
                  onClick={() =>
                    navigate((n) => {
                      n.set("from", toISO(range!.from!));
                      n.set("to", toISO(range!.to!));
                    })
                  }
                >
                  Apply
                </Button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
