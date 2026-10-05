"use client";

import { Check, Minus } from "lucide-react";
import { motion } from "motion/react";
import { Checkbox as CheckboxPrimitive, Switch as SwitchPrimitive, Tabs as TabsPrimitive } from "radix-ui";
import { useId, type ComponentProps, type ReactNode } from "react";
import { transition } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------- Tabs */

export const Tabs = TabsPrimitive.Root;
export const TabsContent = TabsPrimitive.Content;

export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List className={cn("scrollbar-thin -mb-px flex items-center gap-4 overflow-x-auto border-b border-border", className)} {...props} />;
}

export function TabsTrigger({ className, children, count, ...props }: ComponentProps<typeof TabsPrimitive.Trigger> & { count?: number }) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "relative -mb-px inline-flex h-9 shrink-0 items-center gap-1.5 border-b-2 border-transparent text-sm font-medium text-fg-muted transition-colors hover:text-fg data-[state=active]:border-fg data-[state=active]:text-fg",
        className,
      )}
      {...props}
    >
      {children}
      {count !== undefined && <span className="num rounded-sm bg-surface-muted px-1 text-2xs text-fg-muted">{count}</span>}
    </TabsPrimitive.Trigger>
  );
}

/* ------------------------------------------------------- Segmented control */

export function Segmented<T extends string>({
  value,
  onValueChange,
  options,
  label,
  size = "md",
  className,
}: {
  value: T;
  onValueChange: (value: T) => void;
  options: { value: T; label: ReactNode }[];
  label: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const id = useId();
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex items-center rounded-md bg-surface-muted p-0.5", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onValueChange(o.value)}
            className={cn("relative rounded-[5px] px-2.5 font-medium transition-colors", size === "sm" ? "h-6 text-xs" : "h-7 text-sm", active ? "text-fg" : "text-fg-muted hover:text-fg")}
          >
            {active && <motion.span layoutId={`seg-${id}`} transition={transition.spring} className="absolute inset-0 rounded-[5px] bg-surface shadow-sm" />}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------- Checkbox */

export function Checkbox({ className, checked, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      checked={checked}
      className={cn(
        "grid size-4 shrink-0 place-items-center rounded-[4px] border border-border-strong bg-surface transition-colors hover:border-fg-muted data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="text-primary-fg">{checked === "indeterminate" ? <Minus className="size-3" strokeWidth={3} /> : <Check className="size-3" strokeWidth={3} />}</CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

/* ------------------------------------------------------------------ Switch */

export function Switch({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root className={cn("relative inline-flex h-[18px] w-8 shrink-0 items-center rounded-full bg-border-strong transition-colors data-[state=checked]:bg-primary", className)} {...props}>
      <SwitchPrimitive.Thumb className="block size-3.5 translate-x-0.5 rounded-full bg-surface shadow-sm transition-transform duration-150 data-[state=checked]:translate-x-4" />
    </SwitchPrimitive.Root>
  );
}
