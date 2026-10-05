import { ArrowDownToLine, PackageCheck, ShoppingBag, SlidersHorizontal, Tag, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ActivityEvent } from "@/data-access/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const KIND: Record<ActivityEvent["kind"], { icon: LucideIcon; className: string }> = {
  purchase: { icon: ArrowDownToLine, className: "bg-info-soft text-info" },
  receipt: { icon: PackageCheck, className: "bg-primary-soft text-primary-soft-fg" },
  sale: { icon: ShoppingBag, className: "bg-success-soft text-success" },
  price: { icon: Tag, className: "bg-brass-soft text-brass" },
  adjustment: { icon: SlidersHorizontal, className: "bg-warning-soft text-warning" },
};

function refHref(e: ActivityEvent): string | null {
  if (!e.ref) return null;
  if (e.ref.kind === "purchase") return `/procurement/purchases/${e.ref.id}`;
  if (e.ref.kind === "bill") return `/sales/bills/${e.ref.id}`;
  return null;
}

export function ActivityTimeline({ events }: { events: ActivityEvent[] }) {
  return (
    <ol className="relative space-y-0">
      {events.map((e, i) => {
        const k = KIND[e.kind];
        const href = refHref(e);
        return (
          <li key={e.id} className="relative flex gap-3 pb-4">
            {i < events.length - 1 && <span aria-hidden className="absolute top-7 bottom-0 left-[13px] w-px bg-border" />}
            <span className={cn("z-10 grid size-7 shrink-0 place-items-center rounded-full", k.className)}>
              <k.icon className="size-3.5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="text-sm font-medium text-fg">{e.title}</span>
                <time dateTime={e.date} className="text-xs text-fg-muted">
                  {formatDate(e.date)}
                </time>
              </div>
              <div className="text-xs text-fg-muted">
                {href ? (
                  <Link href={href} className="hover:text-fg hover:underline">
                    {e.detail}
                  </Link>
                ) : (
                  e.detail
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
