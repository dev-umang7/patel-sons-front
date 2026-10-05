"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/overlays";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider delayDuration={250} skipDelayDuration={150}>
        {children}
        <Toaster
          position="bottom-right"
          gap={8}
          toastOptions={{
            classNames: {
              toast: "!rounded-lg !border !border-border !bg-surface !text-fg !shadow-lg !font-sans",
              title: "!text-sm !font-medium",
              description: "!text-xs !text-fg-muted",
              actionButton: "!bg-primary !text-primary-fg",
            },
          }}
        />
      </TooltipProvider>
    </MotionConfig>
  );
}
