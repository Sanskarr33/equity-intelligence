import { cn } from "@/lib/utils";
import type { Action } from "@/lib/types";

const styles: Record<Action, string> = {
  BUY: "bg-buy text-primary-foreground",
  ACCUMULATE: "bg-accumulate text-primary-foreground",
  WAIT: "bg-wait text-foreground",
  AVOID: "bg-avoid text-primary-foreground",
  NO_TRADE: "bg-notrade text-primary-foreground",
};

export function ActionBadge({ action, size = "sm" }: { action: Action | null | undefined; size?: "sm" | "lg" }) {
  if (!action) return <span className="text-muted-foreground">—</span>;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded font-semibold tracking-wide",
        size === "lg" ? "px-3 py-1 text-base" : "px-1.5 py-0.5 text-[10px]",
        styles[action] ?? styles.NO_TRADE,
      )}
    >
      {action === "NO_TRADE" ? "NO TRADE" : action}
    </span>
  );
}
