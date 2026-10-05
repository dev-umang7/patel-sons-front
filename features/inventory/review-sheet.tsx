"use client";

import Link from "next/link";
import { MovementBadge } from "@/components/business/badges";
import { ProductThumb } from "@/components/business/product-thumb";
import { RecommendationCard } from "@/components/business/recommendation-card";
import { KeyValue } from "@/components/data-display/metrics";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/overlays";
import type { DecisionItem } from "@/data-access/types";
import { formatCurrency, formatDate, formatDays, formatPercent, formatRelativeDays } from "@/lib/format";
import { DecisionActions } from "./decision-actions";

/** Drawer for reviewing one product's stock and the simulated recommendation without leaving the list. */
export function ReviewSheet({ item, asOf, onOpenChange }: { item: DecisionItem | null; asOf: string; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={item !== null} onOpenChange={onOpenChange}>
      {item && (
        <SheetContent
          title={item.name}
          description={`${item.sku} · ${item.categoryName} · ${item.brandName}`}
          className="max-w-lg"
          footer={
            <Button asChild variant="secondary">
              <Link href={`/inventory/products/${item.productId}`}>Open full product</Link>
            </Button>
          }
        >
          <div className="space-y-5 p-5">
            <div className="flex items-center gap-3">
              <ProductThumb categoryName={item.categoryName} size="lg" />
              <div>
                <MovementBadge movement={item.movement} />
                <div className="mt-1.5 text-2xl font-semibold tracking-tight">{formatCurrency(item.stockValue)}</div>
                <div className="text-xs text-fg-muted">tied up in {item.stockOnHand} units</div>
              </div>
            </div>
            <KeyValue
              items={[
                { label: "Last sale", value: item.lastSaleOn ? `${formatDate(item.lastSaleOn)} · ${formatRelativeDays(item.daysSinceLastSale!)}` : "No sale in 12 months" },
                { label: "Sold in 90 days", value: `${item.unitsSold90} units` },
                { label: "Average stock age", value: item.avgStockAgeDays === null ? "—" : formatDays(item.avgStockAgeDays) },
                { label: "Average cost · last purchase", value: `${formatCurrency(item.avgUnitCost)} · ${item.lastPurchaseCost === null ? "—" : formatCurrency(item.lastPurchaseCost)}` },
                { label: "Selling price · margin", value: `${formatCurrency(item.sellingPrice)} · ${formatPercent(item.marginPercent)}` },
                { label: "Last vendor", value: item.lastVendorName ?? "—" },
              ]}
            />
            <RecommendationCard
              recommendation={item.recommendation}
              actions={<DecisionActions productId={item.productId} productName={item.name} actions={item.recommendation.actions.length ? item.recommendation.actions : ["mark-review"]} replacement={item.recommendation.replacement} asOf={asOf} size="xs" />}
            />
          </div>
        </SheetContent>
      )}
    </Sheet>
  );
}
