"use client";

import { Command } from "cmdk";
import {
  ArrowRight,
  Boxes,
  CornerDownLeft,
  FileText,
  Gift,
  HandCoins,
  Moon,
  Package,
  ReceiptIndianRupee,
  Search,
  Sun,
  Tag,
  Truck,
  User,
  type LucideIcon,
} from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { NAV } from "@/components/navigation/nav-config";
import { Kbd } from "@/components/ui/misc";
import type { SearchEntry } from "@/data-access/types";
import { searchEverything } from "@/features/search/actions";
import { useTheme } from "./theme";
import { useUIStore } from "./ui-store";

const KIND_ICON: Record<SearchEntry["kind"], LucideIcon> = {
  product: Package,
  vendor: Truck,
  customer: User,
  purchase: FileText,
  bill: ReceiptIndianRupee,
  category: Boxes,
  brand: Tag,
};

const KIND_LABEL: Record<SearchEntry["kind"], string> = {
  product: "Products",
  customer: "Customers",
  vendor: "Vendors",
  category: "Categories",
  brand: "Brands",
  purchase: "Purchases",
  bill: "Bills",
};

const itemClass =
  "flex h-9 cursor-default select-none items-center gap-2.5 rounded-md px-2.5 text-sm text-fg outline-none data-[selected=true]:bg-surface-hover [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-fg-muted";
const groupClass = "px-1.5 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-2xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-fg-muted [&_[cmdk-group-heading]]:uppercase";

export function CommandMenu() {
  const open = useUIStore((s) => s.commandOpen);
  const setOpen = useUIStore((s) => s.setCommandOpen);
  const router = useRouter();
  const { setPreference } = useTheme();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchEntry[]>([]);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setOpen(!useUIStore.getState().commandOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  useEffect(() => {
    if (query.trim().length < 2) return;
    const handle = setTimeout(() => {
      startTransition(async () => setResults(await searchEverything(query)));
    }, 140);
    return () => clearTimeout(handle);
  }, [query]);

  const visibleResults = query.trim().length < 2 ? [] : results;

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  const grouped = Object.entries(KIND_LABEL)
    .map(([kind, label]) => ({ kind: kind as SearchEntry["kind"], label, items: visibleResults.filter((r) => r.kind === kind) }))
    .filter((g) => g.items.length > 0);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="overlay-fade fixed inset-0 z-50 bg-overlay" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="dialog-pop fixed top-[12vh] left-1/2 z-50 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-surface shadow-lg outline-none"
        >
          <DialogPrimitive.Title className="sr-only">Search and commands</DialogPrimitive.Title>
          <Command shouldFilter={false} loop label="Search and commands">
            <div className="flex items-center gap-2.5 border-b border-border-subtle px-3.5">
              <Search className="size-4 shrink-0 text-fg-muted" />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Search products, customers, vendors, bills…"
                className="h-12 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-fg-subtle"
              />
              {pending && <span className="size-3.5 animate-spin rounded-full border-2 border-border border-t-primary" aria-label="Searching" />}
              <Kbd>Esc</Kbd>
            </div>
            <Command.List className="scrollbar-thin max-h-[min(60vh,440px)] overflow-y-auto pb-2">
              <Command.Empty className="px-4 py-10 text-center text-sm text-fg-muted">
                {pending ? "Searching…" : `No matches for “${query}”. Try a SKU, phone number or bill number.`}
              </Command.Empty>

              {grouped.map((g) => (
                <Command.Group key={g.kind} heading={g.label} className={groupClass}>
                  {g.items.map((r) => {
                    const Icon = KIND_ICON[r.kind];
                    return (
                      <Command.Item key={`${r.kind}-${r.id}`} value={`${r.kind}-${r.id}`} onSelect={() => go(r.href)} className={itemClass}>
                        <Icon />
                        <span className="min-w-0 flex-1 truncate">{r.title}</span>
                        <span className="hidden max-w-[45%] truncate text-xs text-fg-muted sm:block">{r.subtitle}</span>
                      </Command.Item>
                    );
                  })}
                </Command.Group>
              ))}

              {query.trim().length < 2 && (
                <>
                  <Command.Group heading="Quick actions" className={groupClass}>
                    <Command.Item value="action-po" onSelect={() => go("/procurement/sources")} className={itemClass}>
                      <Truck /> Compare sources &amp; plan a purchase
                    </Command.Item>
                    <Command.Item value="action-payment" onSelect={() => go("/sales/collections")} className={itemClass}>
                      <HandCoins /> Record a debt collection
                    </Command.Item>
                    <Command.Item value="action-gift" onSelect={() => go("/intelligence/gift-selection")} className={itemClass}>
                      <Gift /> Open gift selection
                    </Command.Item>
                    <Command.Item value="theme-light" onSelect={() => { setPreference("light"); setOpen(false); }} className={itemClass}>
                      <Sun /> Switch to light theme
                    </Command.Item>
                    <Command.Item value="theme-dark" onSelect={() => { setPreference("dark"); setOpen(false); }} className={itemClass}>
                      <Moon /> Switch to dark theme
                    </Command.Item>
                  </Command.Group>
                  <Command.Group heading="Go to" className={groupClass}>
                    {NAV.flatMap((m) =>
                      m.items.map((item) => (
                        <Command.Item key={item.href + item.label} value={`nav-${m.id}-${item.href}`} onSelect={() => go(item.href)} className={itemClass}>
                          <m.icon />
                          <span className="flex-1">
                            {m.items.length > 1 && <span className="text-fg-muted">{m.label} · </span>}
                            {item.label}
                          </span>
                          <span className="hidden text-xs text-fg-muted sm:block">{item.hint}</span>
                        </Command.Item>
                      )),
                    )}
                  </Command.Group>
                </>
              )}
            </Command.List>
            <div className="flex items-center gap-3 border-t border-border-subtle px-3.5 py-2 text-2xs text-fg-muted">
              <span className="inline-flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span>
              <span className="inline-flex items-center gap-1"><Kbd><CornerDownLeft className="size-3" /></Kbd> open</span>
              <span className="ml-auto inline-flex items-center gap-1">Results link to the full record <ArrowRight className="size-3" /></span>
            </div>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
