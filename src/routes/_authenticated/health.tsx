import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Empty, ErrorBox, TableSkeleton } from "@/components/States";
import { useDataGaps } from "@/hooks/useDataGaps";
import { useDataHealth } from "@/hooks/useDataHealth";
import { fmtDate, fmtDateTime, int } from "@/lib/format";
import type { DataGap } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/health")({
  head: () => ({
    meta: [
      { title: "Data Health — Equity Intelligence" },
      { name: "description", content: "Freshness of prices, fundamentals and signals, plus known data gaps." },
      { property: "og:title", content: "Data Health — Equity Intelligence" },
      { property: "og:description", content: "Freshness of prices, fundamentals and signals, plus known data gaps." },
    ],
  }),
  component: HealthPage,
});

const GAP_LABEL: Record<DataGap["gap"], string> = {
  stale_price: "Stale price",
  fundamental_withheld: "Fundamental score withheld",
  no_financials_from_source: "No financials from source",
};

function Card({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="panel !p-3">
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function HealthPage() {
  const h = useDataHealth();
  const gaps = useDataGaps();
  const [q, setQ] = useState("");
  const d = h.data;

  const grouped = useMemo(() => {
    const t = q.trim().toLowerCase();
    const m = new Map<string, DataGap[]>();
    for (const g of gaps.data ?? []) {
      if (t && !`${g.symbol} ${g.name ?? ""} ${g.detail ?? ""}`.toLowerCase().includes(t)) continue;
      m.set(g.gap, [...(m.get(g.gap) ?? []), g]);
    }
    return [...m.entries()];
  }, [gaps.data, q]);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold tracking-tight">Data Health</h1>
      {h.isLoading ? (
        <TableSkeleton rows={3} />
      ) : h.error ? (
        <ErrorBox what="data health" />
      ) : !d ? (
        <Empty>No health summary available.</Empty>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Card label="Latest price date" value={fmtDate(d.latest_price_date)} />
            <Card label="Priced on that date" value={`${int(d.stocks_priced_latest)} / ${int(d.stocks)}`} />
            <Card label="Stale prices" value={int(d.stocks_stale)} />
            <Card label="Fundamentals" value={`${int(d.fundamentals_scored)} scored`} sub={`${int(d.fundamentals_withheld)} withheld`} />
            <Card label="Valuation scored" value={int(d.valuation_scored)} />
            <Card label="Active signals" value={int(d.active_signals)} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
            <Card label="Last technical run" value={fmtDateTime(d.last_technical_run)} sub="IST" />
            <Card label="Last fundamental run" value={fmtDateTime(d.last_fundamental_run)} sub="IST" />
            <Card label="Last decision run" value={fmtDateTime(d.last_decision_run)} sub="IST" />
            <Card label="Last financials fetch" value={fmtDateTime(d.last_financials_fetch)} sub="IST" />
          </div>
        </>
      )}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-base font-semibold">Data gaps</h2>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search gaps…" className="field-input w-56" aria-label="Search gaps" />
        </div>
        {gaps.isLoading ? (
          <TableSkeleton />
        ) : gaps.error ? (
          <ErrorBox what="data gaps" />
        ) : !grouped.length ? (
          <Empty>{q ? "No gaps match your search." : "No data gaps — everything is covered."}</Empty>
        ) : (
          grouped.map(([gap, list]) => (
            <div key={gap}>
              <h3 className="mb-1.5 text-sm font-semibold">
                {GAP_LABEL[gap as DataGap["gap"]] ?? gap} <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{list.length}</span>
              </h3>
              <div className="table-wrap !max-h-[40vh]">
                <table className="data-table">
                  <thead><tr><th>Symbol</th><th>Name</th><th>Detail</th></tr></thead>
                  <tbody>
                    {list.map((g, i) => (
                      <tr key={`${g.symbol}-${i}`}>
                        <td className="font-semibold">{g.symbol}</td>
                        <td className="max-w-[240px] truncate">{g.name}</td>
                        <td className="!whitespace-normal text-muted-foreground">{g.detail || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
