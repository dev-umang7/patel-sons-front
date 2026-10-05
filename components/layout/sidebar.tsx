"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { NavTree } from "@/components/navigation/nav-tree";
import { Tooltip } from "@/components/ui/overlays";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BrandMark, BrandWordmark } from "./brand";

export const SIDEBAR_COOKIE = "ps-sidebar";

export function Sidebar({ initialCollapsed, asOf }: { initialCollapsed: boolean; asOf: string }) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next ? "collapsed" : "expanded"}; path=/; max-age=31536000; samesite=lax`;
  };

  return (
    <aside
      aria-label="Sidebar"
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-300 ease-out lg:flex",
        collapsed ? "w-[60px]" : "w-60",
      )}
    >
      <div className={cn("flex h-14 items-center gap-2.5 border-b border-border-subtle", collapsed ? "justify-center px-0" : "px-4")}>
        <Link href="/" aria-label="Patel & Sons — dashboard" className="flex min-w-0 items-center gap-2.5 rounded-md">
          <BrandMark />
          {!collapsed && <BrandWordmark />}
        </Link>
      </div>

      <div className={cn("scrollbar-thin flex-1 overflow-y-auto py-3", collapsed ? "px-0" : "px-2.5")}>
        <NavTree collapsed={collapsed} idPrefix="sidebar" />
      </div>

      <div className={cn("flex items-center border-t border-border-subtle py-2.5", collapsed ? "flex-col gap-2 px-0" : "justify-between gap-2 px-3")}>
        {!collapsed && (
          <div className="min-w-0 text-2xs leading-tight text-fg-muted">
            <div className="font-medium text-fg-secondary">Demo data</div>
            <div className="truncate">As of {formatDate(asOf)}</div>
          </div>
        )}
        <Tooltip content={collapsed ? "Expand sidebar" : "Collapse sidebar"} side="right">
          <button type="button" onClick={toggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="grid size-8 place-items-center rounded-md text-fg-muted hover:bg-surface-hover hover:text-fg">
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
        </Tooltip>
      </div>
    </aside>
  );
}
