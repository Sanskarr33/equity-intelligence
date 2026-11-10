import { num, type Num } from "@/lib/format";

export function ScoreBar({ label, score, classification }: { label: string; score: Num; classification?: string | null }) {
  const n = num(score);
  const pctW = n === null ? 0 : Math.max(0, Math.min(100, n));
  const tone = n === null ? "bg-notrade" : n >= 65 ? "bg-buy" : n >= 45 ? "bg-wait" : "bg-avoid";
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">
          <span className="text-lg font-semibold tabular-nums text-foreground">{n === null ? "—" : Math.round(n)}</span>
          {n !== null && " / 100"}
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${pctW}%` }} />
      </div>
      <div className="mt-1 text-[11px] capitalize text-muted-foreground">{classification?.replace(/_/g, " ") || "—"}</div>
    </div>
  );
}

export function ComponentBar({ name, points, weight, notes }: { name: string; points: Num; weight: Num; notes?: string[] }) {
  const p = num(points);
  const w = num(weight);
  const ratio = p !== null && w ? Math.max(0, Math.min(1, p / w)) : 0;
  return (
    <div className="py-1">
      <div className="flex justify-between text-[11px]">
        <span>{name}</span>
        <span className="tabular-nums text-muted-foreground">
          {p === null ? "—" : p.toFixed(1)} / {w === null ? "—" : w}
        </span>
      </div>
      <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${ratio * 100}%` }} />
      </div>
      {notes && notes.length > 0 && <p className="mt-0.5 text-[10px] text-muted-foreground">{notes.join(" · ")}</p>}
    </div>
  );
}
