"use client";

import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/controls";
import { cn } from "@/lib/utils";

export interface Panel {
  value: string;
  label: string;
  count?: number;
  content: ReactNode;
}

/** Tabs whose panels are rendered on the server and passed in. */
export function TabbedPanel({ panels, className, listClassName, defaultValue }: { panels: Panel[]; className?: string; listClassName?: string; defaultValue?: string }) {
  return (
    <Tabs defaultValue={defaultValue ?? panels[0]?.value} className={className}>
      <TabsList className={cn("px-4", listClassName)}>
        {panels.map((p) => (
          <TabsTrigger key={p.value} value={p.value} count={p.count}>
            {p.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {panels.map((p) => (
        <TabsContent key={p.value} value={p.value} className="outline-none data-[state=active]:animate-fade-in">
          {p.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
