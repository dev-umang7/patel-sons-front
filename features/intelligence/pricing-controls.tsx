"use client";

import { Command } from "cmdk";
import { Check, ChevronsUpDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { ProductThumb } from "@/components/business/product-thumb";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/controls";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/overlays";
import { cn } from "@/lib/utils";

export interface PickerOption {
  id: string;
  name: string;
  sku: string;
  categoryName: string;
}

function useParamSetter() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const set = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value === null) next.delete(key);
    else next.set(key, value);
    start(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
  };
  return { params, set, pending };
}

export function ProductPicker({ options, selectedId }: { options: PickerOption[]; selectedId?: string }) {
  const [open, setOpen] = useState(false);
  const { set, pending } = useParamSetter();
  const selected = options.find((o) => o.id === selectedId);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="secondary" size="lg" role="combobox" aria-expanded={open} className={cn("w-full justify-between sm:w-96", pending && "opacity-70")}>
          <span className="flex min-w-0 items-center gap-2">
            {selected && <ProductThumb categoryName={selected.categoryName} size="sm" />}
            <span className={cn("truncate", !selected && "text-fg-muted")}>{selected?.name ?? "Choose a product to price…"}</span>
          </span>
          <ChevronsUpDown className="text-fg-muted" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(420px,calc(100vw-2rem))] p-0">
        <Command label="Products">
          <Command.Input placeholder="Search name or SKU…" className="h-10 w-full border-b border-border-subtle bg-transparent px-3 text-sm outline-none placeholder:text-fg-subtle" />
          <Command.List className="scrollbar-thin max-h-72 overflow-y-auto p-1">
            <Command.Empty className="px-3 py-6 text-center text-sm text-fg-muted">No product matches.</Command.Empty>
            {options.map((o) => (
              <Command.Item
                key={o.id}
                value={`${o.name} ${o.sku}`}
                onSelect={() => {
                  set("product", o.id);
                  setOpen(false);
                }}
                className="flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm data-[selected=true]:bg-surface-hover"
              >
                <ProductThumb categoryName={o.categoryName} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{o.name}</span>
                  <span className="font-mono text-2xs text-fg-muted">{o.sku}</span>
                </span>
                {o.id === selectedId && <Check className="size-4 text-primary" />}
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const MARGINS = ["auto", "20", "25", "30", "35", "40"] as const;

export function TargetMarginControl({ value }: { value?: string }) {
  const { set } = useParamSetter();
  const current = MARGINS.find((m) => m === value) ?? "auto";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-fg-muted">Target margin</span>
      <Segmented
        size="sm"
        label="Target margin"
        value={current}
        onValueChange={(v) => set("margin", v === "auto" ? null : v)}
        options={MARGINS.map((m) => ({ value: m, label: m === "auto" ? "Auto" : `${m}%` }))}
      />
    </div>
  );
}
