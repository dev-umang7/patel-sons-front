"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { ErrorState } from "@/components/feedback/states";
import { Page } from "@/components/layout/page";
import { Button } from "@/components/ui/button";

export default function AppError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <Page>
      <div className="rounded-lg border border-border bg-surface">
        <ErrorState
          title="This view couldn't be loaded"
          description={
            <>
              The data for this page failed to load. Nothing you entered has been lost. Try again, or go back to the dashboard.
              {error.digest && <span className="mt-2 block font-mono text-2xs text-fg-subtle">Reference: {error.digest}</span>}
            </>
          }
          action={
            <>
              <Button variant="primary" size="sm" onClick={() => retry()}>
                <RotateCcw /> Try again
              </Button>
              <Button asChild size="sm">
                <Link href="/">Dashboard</Link>
              </Button>
            </>
          }
        />
      </div>
    </Page>
  );
}
