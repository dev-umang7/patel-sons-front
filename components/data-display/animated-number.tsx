"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { formatCurrency, formatCurrencyCompact, formatNumber, formatNumberCompact, formatPercent } from "@/lib/format";

export type NumberFormat = "currency" | "currency-compact" | "number" | "number-compact" | "percent";

const FORMATTERS: Record<NumberFormat, (n: number) => string> = {
  currency: (n) => formatCurrency(Math.round(n)),
  "currency-compact": formatCurrencyCompact,
  number: (n) => formatNumber(Math.round(n)),
  "number-compact": formatNumberCompact,
  percent: (n) => formatPercent(n),
};

/** Counts up once when first visible. The final value is always in the DOM for assistive tech. */
export function AnimatedNumber({ value, format = "number", className }: { value: number; format?: NumberFormat; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState<number | null>(null);
  const fmt = FORMATTERS[format];

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(value * 0.92, value, {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
      onComplete: () => setDisplay(null),
    });
    return () => controls.stop();
  }, [inView, reduce, value]);

  return (
    <span ref={ref} className={className}>
      <span aria-hidden>{fmt(display ?? value)}</span>
      <span className="sr-only">{fmt(value)}</span>
    </span>
  );
}
