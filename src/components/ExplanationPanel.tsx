import type { SignalRow } from "@/lib/types";

const SECTIONS: [keyof SignalRow, string][] = [
  ["why_attractive", "Why attractive"],
  ["price_suitability", "Price suitability"],
  ["risks", "Risks"],
  ["invalidation", "Invalidation"],
  ["next_action", "Next action"],
];

export function ExplanationPanel({ s, columns = false }: { s: SignalRow; columns?: boolean }) {
  return (
    <div className={columns ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-5" : "space-y-2.5"}>
      {SECTIONS.map(([k, label]) => (
        <div key={k}>
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</h4>
          <p className="mt-0.5 whitespace-normal text-xs leading-relaxed">{(s[k] as string | null) || "—"}</p>
        </div>
      ))}
    </div>
  );
}
