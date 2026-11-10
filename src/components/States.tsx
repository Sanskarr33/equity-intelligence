import type * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-1.5 rounded-md border bg-card p-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-6 w-full" />
      ))}
    </div>
  );
}

export function ErrorBox({ what }: { what: string }) {
  return (
    <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
      Couldn't load {what} — check your connection and sign in again.
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-md border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">{children}</div>;
}
