import { CookingPot, Fan, Gift, Lamp, Microwave, Milk, Package, Scissors, UtensilsCrossed, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const RULES: { match: RegExp; icon: LucideIcon; tint: string }[] = [
  { match: /kitchen/i, icon: Microwave, tint: "bg-tile-1-bg text-tile-1-fg" },
  { match: /cook/i, icon: CookingPot, tint: "bg-tile-2-bg text-tile-2-fg" },
  { match: /dinner|serve/i, icon: UtensilsCrossed, tint: "bg-tile-3-bg text-tile-3-fg" },
  { match: /storage|bottle/i, icon: Milk, tint: "bg-tile-4-bg text-tile-4-fg" },
  { match: /d[eé]cor/i, icon: Lamp, tint: "bg-tile-5-bg text-tile-5-fg" },
  { match: /personal/i, icon: Scissors, tint: "bg-tile-6-bg text-tile-6-fg" },
  { match: /comfort/i, icon: Fan, tint: "bg-tile-7-bg text-tile-7-fg" },
  { match: /gift/i, icon: Gift, tint: "bg-tile-8-bg text-tile-8-fg" },
];

/**
 * Product image placeholder. Real imagery arrives with the catalogue backend;
 * until then a category-derived tile keeps lists scannable.
 */
export function ProductThumb({ categoryName, size = "md", className }: { categoryName: string; size?: "sm" | "md" | "lg" | "xl"; className?: string }) {
  const rule = RULES.find((r) => r.match.test(categoryName));
  const Icon = rule?.icon ?? Package;
  const sizeClass = { sm: "size-7 rounded-md [&_svg]:size-3.5", md: "size-9 rounded-md [&_svg]:size-4", lg: "size-14 rounded-lg [&_svg]:size-6", xl: "size-24 rounded-xl [&_svg]:size-10" }[size];
  return (
    <span aria-hidden className={cn("grid shrink-0 place-items-center", rule?.tint ?? "bg-surface-muted text-fg-muted", sizeClass, className)}>
      <Icon strokeWidth={1.6} />
    </span>
  );
}
