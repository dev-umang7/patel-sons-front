/**
 * Chart palette as CSS-variable references. Kept in a plain (non-client) module so
 * server components can import it — constants exported from "use client" modules
 * arrive on the server as client references, not values.
 * Order is the validated categorical order; assign by entity, never by rank.
 */
export const SERIES = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--chart-6)", "var(--chart-7)", "var(--chart-8)"] as const;
