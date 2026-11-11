import { cn } from "@/lib/utils";
import type { Advice } from "@/lib/paper";

const styles: Record<Advice, string> = {
  HOLD: "bg-notrade text-primary-foreground",
  TRAIL_STOP: "bg-level-target text-primary-foreground",
  BOOK_PROFIT: "bg-accumulate text-primary-foreground",
  EXIT: "bg-avoid text-primary-foreground",
  REVIEW: "bg-wait text-foreground",
};

export function AdviceBadge({ advice, note }: { advice: Advice | null | undefined; note?: string | null }) {
  if (!advice) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="min-w-[120px]">
      <span title={note ?? undefined} className={cn("inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide", styles[advice] ?? styles.HOLD)}>
        {advice.replace(/_/g, " ")}
      </span>
      {note && <div className="mt-0.5 !whitespace-normal text-[11px] leading-snug text-muted-foreground">{note}</div>}
    </div>
  );
}
