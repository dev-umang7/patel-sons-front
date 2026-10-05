"use client";

import { NavTree } from "@/components/navigation/nav-tree";
import { Sheet, SheetContent } from "@/components/ui/overlays";
import { formatDate } from "@/lib/format";
import { BrandMark, BrandWordmark } from "./brand";
import { useUIStore } from "./ui-store";

export function MobileNav({ asOf }: { asOf: string }) {
  const open = useUIStore((s) => s.mobileNavOpen);
  const setOpen = useUIStore((s) => s.setMobileNavOpen);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="left" title="Navigation" hideHeader className="p-0">
        <div className="flex h-14 items-center gap-2.5 border-b border-border-subtle px-4">
          <BrandMark />
          <BrandWordmark />
        </div>
        <div className="p-2.5">
          <NavTree idPrefix="mobile" onNavigate={() => setOpen(false)} />
        </div>
        <div className="border-t border-border-subtle px-4 py-3 text-2xs text-fg-muted">Demo data · as of {formatDate(asOf)}</div>
      </SheetContent>
    </Sheet>
  );
}
