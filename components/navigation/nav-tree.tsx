"use client";

import { ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Tooltip } from "@/components/ui/overlays";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { findActive, NAV } from "./nav-config";

/** Module → page tree used by the desktop sidebar and the mobile drawer. */
export function NavTree({ collapsed = false, onNavigate, idPrefix }: { collapsed?: boolean; onNavigate?: () => void; idPrefix: string }) {
  const pathname = usePathname();
  const active = findActive(pathname);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const isOpen = (id: string) => open[id] ?? id === active.module.id;

  return (
    <nav aria-label="Primary" className="flex flex-col gap-0.5">
      {NAV.map((module) => {
        const Icon = module.icon;
        const moduleActive = module.id === active.module.id;
        const single = module.items.length === 1;

        if (collapsed) {
          return (
            <Tooltip key={module.id} content={module.label} side="right">
              <Link
                href={module.href}
                onClick={onNavigate}
                aria-label={module.label}
                aria-current={moduleActive ? "page" : undefined}
                className={cn(
                  "mx-auto grid size-9 place-items-center rounded-md transition-colors",
                  moduleActive ? "bg-surface-selected text-primary-soft-fg" : "text-fg-muted hover:bg-surface-hover hover:text-fg",
                )}
              >
                <Icon className="size-[18px]" strokeWidth={1.75} />
              </Link>
            </Tooltip>
          );
        }

        if (single) {
          return (
            <Link
              key={module.id}
              href={module.href}
              onClick={onNavigate}
              aria-current={moduleActive ? "page" : undefined}
              className={cn(
                "flex h-8 items-center gap-2.5 rounded-md px-2 text-sm font-medium transition-colors",
                moduleActive ? "bg-surface-selected text-fg" : "text-fg-secondary hover:bg-surface-hover hover:text-fg",
              )}
            >
              <Icon className={cn("size-4", moduleActive ? "text-primary" : "text-fg-muted")} strokeWidth={1.75} />
              {module.label}
            </Link>
          );
        }

        const expanded = isOpen(module.id);
        const listId = `${idPrefix}-${module.id}`;
        return (
          <div key={module.id}>
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={listId}
              onClick={() => setOpen((s) => ({ ...s, [module.id]: !expanded }))}
              className={cn(
                "flex h-8 w-full items-center gap-2.5 rounded-md px-2 text-sm font-medium transition-colors hover:bg-surface-hover",
                moduleActive ? "text-fg" : "text-fg-secondary hover:text-fg",
              )}
            >
              <Icon className={cn("size-4", moduleActive ? "text-primary" : "text-fg-muted")} strokeWidth={1.75} />
              <span className="flex-1 text-left">{module.label}</span>
              <ChevronRight className={cn("size-3.5 text-fg-subtle transition-transform duration-200", expanded && "rotate-90")} />
            </button>
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  id={listId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: duration.base, ease: ease.out }}
                  className="overflow-hidden"
                >
                  <ul className="relative ml-[17px] flex flex-col gap-px border-l border-border py-1 pl-2.5">
                    {module.items.map((item) => {
                      const itemActive = active.item?.href === item.href;
                      return (
                        <li key={item.href} className="relative">
                          {itemActive && <motion.span layoutId={`${idPrefix}-active`} className="absolute top-1 bottom-1 -left-[11px] w-0.5 rounded-full bg-primary" transition={{ duration: duration.base, ease: ease.out }} />}
                          <Link
                            href={item.href}
                            onClick={onNavigate}
                            aria-current={itemActive ? "page" : undefined}
                            className={cn(
                              "flex h-7 items-center rounded-md px-2 text-[13px] transition-colors",
                              itemActive ? "bg-surface-selected font-medium text-fg" : "text-fg-muted hover:bg-surface-hover hover:text-fg",
                            )}
                          >
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </nav>
  );
}
