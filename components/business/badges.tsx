import { CircleDashed, Flame, Snowflake, TrendingUp } from "lucide-react";
import { Badge, type BadgeTone, StatusDot } from "@/components/ui/badge";
import type {
  BillKind,
  Confidence,
  CouponStatus,
  InventoryDecision,
  MovementClass,
  OfferStatus,
  PaymentMode,
  ProductStatus,
  PurchaseStatus,
  ReceivableStatus,
} from "@/data-access/types";
import { cn } from "@/lib/utils";

export const MOVEMENT_META: Record<MovementClass, { label: string; tone: BadgeTone; icon: typeof Flame; description: string }> = {
  fast: { label: "Fast moving", tone: "success", icon: Flame, description: "Sells through quickly" },
  normal: { label: "Normal", tone: "neutral", icon: TrendingUp, description: "Steady movement" },
  slow: { label: "Slow moving", tone: "warning", icon: CircleDashed, description: "Stock lasts well beyond target" },
  dead: { label: "Dead / very slow", tone: "danger", icon: Snowflake, description: "Not selling — money tied up" },
};

export function MovementBadge({ movement, compact }: { movement: MovementClass; compact?: boolean }) {
  const m = MOVEMENT_META[movement];
  return (
    <Badge tone={m.tone} title={`${m.label} — calculated from recent sales velocity`}>
      <m.icon aria-hidden />
      {compact ? m.label.split(" ")[0] : m.label}
    </Badge>
  );
}

const PRODUCT_STATUS: Record<ProductStatus, { label: string; tone: BadgeTone }> = {
  active: { label: "Active", tone: "success" },
  "under-review": { label: "Under review", tone: "warning" },
  discontinued: { label: "Discontinued", tone: "neutral" },
};

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const s = PRODUCT_STATUS[status];
  return <StatusDot tone={s.tone}>{s.label}</StatusDot>;
}

export const PURCHASE_STATUS: Record<PurchaseStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: "Draft", tone: "outline" },
  ordered: { label: "Ordered", tone: "info" },
  "partially-received": { label: "Partially received", tone: "warning" },
  received: { label: "Received", tone: "success" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

export function PurchaseStatusBadge({ status }: { status: PurchaseStatus }) {
  const s = PURCHASE_STATUS[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export const RECEIVABLE_STATUS: Record<ReceivableStatus, { label: string; tone: BadgeTone }> = {
  paid: { label: "Paid", tone: "success" },
  current: { label: "Current", tone: "neutral" },
  "due-soon": { label: "Due soon", tone: "info" },
  overdue: { label: "Overdue", tone: "warning" },
  critical: { label: "Critical", tone: "danger" },
};

export function DebtStatusBadge({ status }: { status: ReceivableStatus }) {
  const s = RECEIVABLE_STATUS[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export const OFFER_STATUS: Record<OfferStatus, { label: string; tone: BadgeTone }> = {
  upcoming: { label: "Upcoming", tone: "info" },
  active: { label: "Active", tone: "success" },
  expiring: { label: "Expiring soon", tone: "warning" },
  expired: { label: "Expired", tone: "neutral" },
};

export function OfferStatusBadge({ status }: { status: OfferStatus }) {
  const s = OFFER_STATUS[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export const COUPON_STATUS: Record<CouponStatus, { label: string; tone: BadgeTone }> = {
  scheduled: { label: "Scheduled", tone: "info" },
  "live-today": { label: "Live today", tone: "success" },
  active: { label: "Active", tone: "primary" },
  ended: { label: "Ended", tone: "neutral" },
  paused: { label: "Paused", tone: "warning" },
};

export function CouponStatusBadge({ status }: { status: CouponStatus }) {
  const s = COUPON_STATUS[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export const DECISION_META: Record<InventoryDecision, { label: string; tone: BadgeTone; description: string }> = {
  keep: { label: "Keep", tone: "success", description: "Continue stocking" },
  review: { label: "Review", tone: "info", description: "Needs a management look" },
  replace: { label: "Replace", tone: "warning", description: "Swap for a better line" },
  eliminate: { label: "Eliminate", tone: "danger", description: "Clear and drop from range" },
};

export function DecisionBadge({ decision, className }: { decision: InventoryDecision; className?: string }) {
  const d = DECISION_META[decision];
  return (
    <Badge tone={d.tone} className={className}>
      {d.label}
    </Badge>
  );
}

const TIER_TONE: Record<string, BadgeTone> = { Member: "outline", Silver: "neutral", Gold: "brass", Platinum: "primary" };

export function LoyaltyTierBadge({ tier }: { tier: string }) {
  return <Badge tone={TIER_TONE[tier] ?? "neutral"}>{tier}</Badge>;
}

export const PAYMENT_MODE_LABEL: Record<PaymentMode, string> = { cash: "Cash", upi: "UPI", card: "Card", credit: "Credit" };

export function BillKindBadge({ kind }: { kind: BillKind }) {
  return kind === "gift" ? <Badge tone="brass">Gift bill</Badge> : null;
}

export function ConfidenceIndicator({ confidence, className }: { confidence: Confidence; className?: string }) {
  const level = { low: 1, medium: 2, high: 3 }[confidence];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-fg-secondary", className)} title="Confidence reflects how much data supports the simulated output">
      <span aria-hidden className="inline-flex items-end gap-0.5">
        {[1, 2, 3].map((i) => (
          <span key={i} className={cn("w-1 rounded-[1px]", i <= level ? "bg-intel" : "bg-intel-border")} style={{ height: 4 + i * 3 }} />
        ))}
      </span>
      <span className="capitalize">{confidence}</span>
      <span className="sr-only">confidence</span>
    </span>
  );
}
