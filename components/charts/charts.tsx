"use client";

import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useReducedMotion } from "motion/react";
import { formatAxisCurrency, formatCurrency, formatDate, formatDateShort, formatMonth, formatNumber } from "@/lib/format";
import type { Granularity } from "@/lib/period";
import { ChartTooltipCard, Legend } from "./chart-tooltip";


const AXIS = { tickLine: false, axisLine: false, tickMargin: 8 } as const;

function bucketLabel(bucket: string, granularity: Granularity, long = false): string {
  if (granularity === "month") return formatMonth(bucket);
  if (granularity === "week") return long ? `Week of ${formatDate(bucket)}` : formatDateShort(bucket);
  return long ? formatDate(bucket) : formatDateShort(bucket);
}

/* -------------------------------------------------------------- TrendChart */

export interface TrendDatum {
  bucket: string;
  value: number;
  previous?: number;
}

/**
 * One measure over time, with the previous period as a recessive dashed line.
 * Area wash at ~10% opacity; crosshair finds the X.
 */
export function TrendChart({
  data,
  granularity,
  label,
  previousLabel = "Previous period",
  height = 260,
  format = "currency",
}: {
  data: TrendDatum[];
  granularity: Granularity;
  label: string;
  previousLabel?: string;
  height?: number;
  format?: "currency" | "number";
}) {
  const animate = !useReducedMotion();
  const fmt = format === "currency" ? formatCurrency : formatNumber;
  const hasPrevious = data.some((d) => d.previous !== undefined);
  return (
    <div>
      {hasPrevious && (
        <Legend
          className="mb-3"
          items={[
            { label, color: "var(--chart-primary)" },
            { label: previousLabel, color: "var(--chart-comparison)", kind: "dashed" },
          ]}
        />
      )}
      <div style={{ height }} role="img" aria-label={`${label} over time`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-primary)" stopOpacity={0.14} />
                <stop offset="100%" stopColor="var(--chart-primary)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="bucket" {...AXIS} minTickGap={24} tickFormatter={(b: string) => bucketLabel(b, granularity)} />
            <YAxis {...AXIS} width={56} tickFormatter={(v: number) => (format === "currency" ? formatAxisCurrency(v) : formatNumber(v))} />
            <Tooltip
              cursor={{ stroke: "var(--chart-cursor)", strokeWidth: 1 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as TrendDatum;
                return (
                  <ChartTooltipCard
                    title={bucketLabel(d.bucket, granularity, true)}
                    rows={[
                      { key: "v", label, value: fmt(d.value), color: "var(--chart-primary)" },
                      ...(d.previous !== undefined ? [{ key: "p", label: previousLabel, value: fmt(d.previous), color: "var(--chart-comparison)", dashed: true }] : []),
                    ]}
                  />
                );
              }}
            />
            {hasPrevious && <Line dataKey="previous" type="monotone" stroke="var(--chart-comparison)" strokeWidth={2} strokeDasharray="4 3" dot={false} activeDot={false} isAnimationActive={false} />}
            <Area dataKey="value" type="monotone" stroke="var(--chart-primary)" strokeWidth={2} fill="url(#trend-fill)" activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)" }} isAnimationActive={animate} animationDuration={700} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- ColumnChart */

export interface ColumnSeries {
  key: string;
  label: string;
  color: string;
}

/** Columns from one baseline. ≤24px wide, 4px rounded data-end, square at baseline. */
export function ColumnChart({
  data,
  series,
  xKey,
  xFormat = "month",
  height = 240,
  stacked = false,
  format = "currency",
}: {
  data: Record<string, string | number>[];
  series: ColumnSeries[];
  xKey: string;
  xFormat?: "month" | "day" | "raw";
  height?: number;
  stacked?: boolean;
  format?: "currency" | "number";
}) {
  const animate = !useReducedMotion();
  const fmt = format === "currency" ? formatCurrency : formatNumber;
  const xLabel = (v: string) => (xFormat === "month" ? formatMonth(v) : xFormat === "day" ? formatDateShort(v) : v);
  return (
    <div>
      {series.length > 1 && <Legend className="mb-3" items={series.map((s) => ({ label: s.label, color: s.color, kind: "box" as const }))} />}
      <div style={{ height }} role="img" aria-label={series.map((s) => s.label).join(", ")}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: 0 }} barGap={2} barCategoryGap="28%">
            <CartesianGrid vertical={false} />
            <XAxis dataKey={xKey} {...AXIS} minTickGap={12} tickFormatter={xLabel} />
            <YAxis {...AXIS} width={56} tickFormatter={(v: number) => (format === "currency" ? formatAxisCurrency(v) : formatNumber(v))} />
            <Tooltip
              cursor={{ fill: "var(--surface-hover)" }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <ChartTooltipCard
                    title={xLabel(String(label))}
                    rows={series.map((s) => ({ key: s.key, label: s.label, value: fmt(Number((payload[0].payload as Record<string, number>)[s.key] ?? 0)), color: s.color }))}
                  />
                );
              }}
            />
            {series.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                fill={s.color}
                maxBarSize={24}
                stackId={stacked ? "stack" : undefined}
                radius={stacked ? (i === series.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]) : [4, 4, 0, 0]}
                stroke={stacked ? "var(--surface)" : undefined}
                strokeWidth={stacked ? 1 : 0}
                isAnimationActive={animate} animationDuration={600}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- MultiLineChart */

export function MultiLineChart({
  data,
  series,
  xKey,
  height = 240,
  xFormat = "month",
  yDomain,
}: {
  data: Record<string, string | number>[];
  series: ColumnSeries[];
  xKey: string;
  height?: number;
  xFormat?: "month" | "day";
  yDomain?: [number | "auto" | "dataMin", number | "auto" | "dataMax"];
}) {
  const animate = !useReducedMotion();
  const xLabel = (v: string) => (xFormat === "month" ? formatMonth(v) : formatDateShort(v));
  return (
    <div>
      {series.length > 1 && <Legend className="mb-3" items={series.map((s) => ({ label: s.label, color: s.color }))} />}
      <div style={{ height }} role="img" aria-label={`Trend for ${series.map((s) => s.label).join(", ")}`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey={xKey} {...AXIS} minTickGap={16} tickFormatter={xLabel} />
            <YAxis {...AXIS} width={56} domain={yDomain ?? ["auto", "auto"]} tickFormatter={(v: number) => formatAxisCurrency(v)} />
            <Tooltip
              cursor={{ stroke: "var(--chart-cursor)", strokeWidth: 1 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0].payload as Record<string, number>;
                return (
                  <ChartTooltipCard
                    title={xLabel(String(label))}
                    rows={series.filter((s) => row[s.key] !== undefined).map((s) => ({ key: s.key, label: s.label, value: formatCurrency(Number(row[s.key])), color: s.color }))}
                  />
                );
              }}
            />
            {series.map((s) => (
              <Line key={s.key} dataKey={s.key} type="monotone" stroke={s.color} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)" }} connectNulls isAnimationActive={animate} animationDuration={600} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
