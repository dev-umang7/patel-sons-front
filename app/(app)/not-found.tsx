import { FileQuestion } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/feedback/states";
import { Page } from "@/components/layout/page";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Page>
      <div className="rounded-lg border border-border bg-surface">
        <EmptyState
          icon={FileQuestion}
          title="We couldn't find that record"
          description="It may have been removed, or the link may be incomplete. Use search (Ctrl K) to find products, customers, vendors or bills."
          action={
            <Button asChild variant="primary" size="sm">
              <Link href="/">Back to dashboard</Link>
            </Button>
          }
        />
      </div>
    </Page>
  );
}
