import { confidencePct, fixed, inr, int } from "@/lib/format";
import type { SignalRow } from "@/lib/types";

export function LevelsTable({ s }: { s: SignalRow }) {
  const longTerm = s.strategy === "long_term";
  const rows: [string, string, string?][] = [
    ["Entry range", s.entry_low == null && s.entry_high == null ? "—" : `${inr(s.entry_low)} – ${inr(s.entry_high)}`, "text-level-entry"],
    longTerm ? ["Review below", inr(s.invalidation_level), "text-level-stop"] : ["Stop", inr(s.stop_loss), "text-level-stop"],
    ["Target 1", inr(s.target_1), "text-level-target"],
    ["Target 2", inr(s.target_2), "text-level-target"],
    ["R:R", fixed(s.risk_reward, 2)],
    ["Quantity", int(s.quantity)],
    ["Confidence", confidencePct(s.confidence)],
  ];
  return (
    <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
      {rows.map(([k, v, c]) => (
        <div key={k} className="contents">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className={`text-right font-medium tabular-nums ${c ?? ""}`}>{v}</dd>
        </div>
      ))}
    </dl>
  );
}
