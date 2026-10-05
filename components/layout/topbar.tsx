"use client";

import {
  AlertOctagon,
  AlertTriangle,
  Bell,
  ChevronRight,
  Gift,
  HandCoins,
  Info,
  Menu,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  Truck,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { findActive } from "@/components/navigation/nav-config";
import { Button, IconButton } from "@/components/ui/button";
import { Avatar, Kbd } from "@/components/ui/misc";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/overlays";
import type { ManagementAlert } from "@/data-access/types";
import { cn } from "@/lib/utils";
import { THEME_OPTIONS, useTheme } from "./theme";
import { useUIStore } from "./ui-store";

const SEVERITY: Record<ManagementAlert["severity"], { icon: LucideIcon; className: string }> = {
  critical: { icon: AlertOctagon, className: "text-danger bg-danger-soft" },
  warning: { icon: AlertTriangle, className: "text-warning bg-warning-soft" },
  info: { icon: Info, className: "text-info bg-info-soft" },
  positive: { icon: TrendingUp, className: "text-success bg-success-soft" },
};

export function Topbar({ alerts }: { alerts: ManagementAlert[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const { module, item } = findActive(pathname);
  const setCommandOpen = useUIStore((s) => s.setCommandOpen);
  const setMobileNavOpen = useUIStore((s) => s.setMobileNavOpen);
  const { preference, setPreference } = useTheme();
  const attention = alerts.filter((a) => a.severity === "critical" || a.severity === "warning").length;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-bg/85 px-3 backdrop-blur-md supports-[backdrop-filter]:bg-bg/75 sm:px-5">
      <IconButton label="Open navigation" className="lg:hidden" onClick={() => setMobileNavOpen(true)}>
        <Menu />
      </IconButton>

      <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1 text-sm md:flex">
        <Link href={module.href} className="truncate text-fg-muted hover:text-fg">
          {module.label}
        </Link>
        {item && item.label !== module.label && (
          <>
            <ChevronRight aria-hidden className="size-3.5 shrink-0 text-fg-subtle" />
            <Link href={item.href} aria-current="page" className="truncate font-medium text-fg">
              {item.label}
            </Link>
          </>
        )}
      </nav>

      <div className="flex flex-1 justify-center px-1 md:px-6">
        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          className="group flex h-8 w-full max-w-md items-center gap-2 rounded-md border border-border bg-surface px-2.5 text-sm text-fg-subtle shadow-xs transition-colors hover:border-border-strong hover:text-fg-muted"
        >
          <Search className="size-3.5 shrink-0" />
          <span className="flex-1 truncate text-left">Search or jump to…</span>
          <span className="hidden items-center gap-0.5 sm:flex">
            <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>
      </div>

      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="primary" size="sm" className="hidden sm:inline-flex">
              <Plus /> New
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-60">
            <DropdownMenuLabel>Quick actions</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => router.push("/procurement/orders?new=1")}>
              <Truck /> Purchase order
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => router.push("/sales/collections")}>
              <HandCoins /> Record payment
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => router.push("/intelligence/gift-selection")}>
              <Gift /> Gift selection
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => router.push("/intelligence/pricing")}>
              <Sparkles /> Price composition
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Popover>
          <PopoverTrigger asChild>
            <button type="button" aria-label={`Management alerts (${attention} need attention)`} className="relative grid size-8 place-items-center rounded-md text-fg-muted hover:bg-surface-hover hover:text-fg">
              <Bell className="size-4" />
              {attention > 0 && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-danger ring-2 ring-bg" />}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[min(380px,calc(100vw-1.5rem))] p-0">
            <div className="flex items-center justify-between border-b border-border-subtle px-3.5 py-2.5">
              <div className="text-sm font-semibold">Management alerts</div>
              <span className="text-2xs text-fg-muted">Calculated from current data</span>
            </div>
            <ul className="scrollbar-thin max-h-96 overflow-y-auto p-1.5">
              {alerts.map((a) => {
                const s = SEVERITY[a.severity];
                return (
                  <li key={a.id}>
                    <Link href={a.href} className="flex gap-2.5 rounded-md p-2 hover:bg-surface-hover">
                      <span className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-md", s.className)}>
                        <s.icon className="size-3.5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm leading-snug font-medium text-fg">{a.title}</span>
                        <span className="mt-0.5 block truncate text-xs text-fg-muted">{a.detail}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" aria-label="Account and preferences" className="ml-1 rounded-full outline-offset-2">
              <Avatar name="Patel Sons" tone="primary" className="size-8" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <div className="px-2 py-1.5">
              <div className="text-sm font-medium">Management</div>
              <div className="text-xs text-fg-muted">Patel &amp; Sons · Demo workspace</div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Theme</DropdownMenuLabel>
            {THEME_OPTIONS.map((o) => (
              <DropdownMenuItem key={o.value} onSelect={() => setPreference(o.value)}>
                <o.icon />
                <span className="flex-1">{o.label}</span>
                {preference === o.value && <span className="size-1.5 rounded-full bg-primary" aria-label="Selected" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Sign-in arrives with the backend</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
