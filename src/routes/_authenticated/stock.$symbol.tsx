import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ActionBadge } from "@/components/ActionBadge";
import { Change } from "@/components/Change";
import { ExplanationPanel } from "@/components/ExplanationPanel";
import { LevelsTable } from "@/components/LevelsTable";
import { AdviceBadge } from "@/components/paper/AdviceBadge";
import { PaperBuyButton } from "@/components/paper/PaperBuyButton";
import { PriceChart } from "@/components/PriceChart";
import { ComponentBar, ScoreBar } from "@/components/ScoreBar";
import { Empty, ErrorBox, TableSkeleton } from "@/components/States";
import { useAnalysisScores } from "@/hooks/useAnalysisScores";
import { usePriceBars } from "@/hooks/usePriceBars";
import { useSignalHistory } from "@/hooks/useSignalHistory";
import { useStock } from "@/hooks/useStocks";
import { useStockSignals } from "@/hooks/useStockSignals";
import { asStringArray, fixed, fmtDate, inr, int, strategyLabel } from "@/lib/format";
import { usePaperPositions } from "@/lib/paper";
import { STRATEGIES, type Fact, type SignalRow, type Strategy } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/stock/$symbol")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.symbol} — Equity Intelligence` },
      { name: "description", content: `Verdicts, chart, scores and signal history for ${params.symbol}.` },
      { property: "og:title", content: `${params.symbol} — Equity Intelligence` },
      { property: "og:description", content: `Verdicts, chart, scores and signal history for ${params.symbol}.` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StockPage,
});

function StockPage() {
  const { symbol } = Route.useParams();
  const stock = useStock(symbol);
  const id = stock.data?.instrument_id;
  const signals = useStockSignals(id);
  const bars = usePriceBars(id);
  const scores = useAnalysisScores(id);
  const history = useSignalHistory(id);

  const byStrategy = useMemo(() => {
    const m: Partial<Record<Strategy, SignalRow>> = {};
    for (const s of signals.data ?? []) m[s.strategy] = s;
    return m;
  }, [signals.data]);

  const [chartStrategy, setChartStrategy] = useState<Strategy>("swing");
  useEffect(() => {
    const best = STRATEGIES.find((k) => ["BUY", "ACCUMULATE"].includes(byStrategy[k]?.action ?? ""));
    setChartStrategy(best ?? "swing");
  }, [byStrategy]);

  if (stock.isLoading) return <TableSkeleton rows={10} />;
  if (stock.error) return <ErrorBox what="this stock" />;
  const s = stock.data;
  if (!s) return <Empty>No stock found for “{symbol}”.</Empty>;

  const facts = (() => {
    const seen = new Set<string>();
    return ((byStrategy.swing?.facts ?? []) as Fact[]).filter((f) => {
      if (!f?.label || seen.has(f.label)) return false;
      seen.add(f.label);
      return true;
    });
  })();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{s.name} ({s.symbol})</h1>
        <p className="mt-1 flex flex-wrap items-baseline gap-x-3 text-sm text-muted-foreground">
          <span>{s.framework ?? "—"}</span>
          <span className="text-lg font-semibold text-foreground tabular-nums">{inr(s.close)}</span>
          <Change value={s.change_pct} />
          <span>as of {fmtDate(s.last_date)}</span>
        </p>
      </div>

      {signals.error ? <ErrorBox what="signals" /> : (
        <div className="grid gap-3 md:grid-cols-3">
          {STRATEGIES.map((k) => {
            const sig = byStrategy[k];
            return (
              <div key={k} className="panel space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">{strategyLabel(k)}</h2>
                  {signals.isLoading ? <span className="text-xs text-muted-foreground">…</span> : <ActionBadge action={sig?.action} size="lg" />}
                </div>
                {sig ? (
                  <>
                    <LevelsTable s={sig} />
                    <PaperBuyButton s={sig} />
                    <Bullets title="Entry conditions" items={asStringArray(sig.entry_conditions)} />
                    <Bullets title="Invalidation conditions" items={asStringArray(sig.invalidation_conditions)} />
                    <details className="text-xs">
                      <summary className="cursor-pointer font-medium text-primary">Explanation</summary>
                      <div className="mt-2"><ExplanationPanel s={sig} /></div>
                    </details>
                  </>
                ) : !signals.isLoading && <p className="text-xs text-muted-foreground">No active signal.</p>}
              </div>
            );
          })}
        </div>
      )}

      <StockPaperPositions symbol={s.symbol} />

      <div className="panel">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="section-title !mb-0">Price chart</h2>
          <div className="flex gap-1">
            {STRATEGIES.map((k) => (
              <button key={k} type="button" onClick={() => setChartStrategy(k)}
                className={`rounded px-2 py-1 text-xs ${chartStrategy === k ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {strategyLabel(k)}
              </button>
            ))}
          </div>
        </div>
        {bars.isLoading ? <TableSkeleton rows={6} /> : bars.error ? <ErrorBox what="price history" /> : !bars.data?.length ? <Empty>No price history.</Empty> : (
            <PriceChart bars={bars.data} {...(byStrategy[chartStrategy] ? { signal: byStrategy[chartStrategy] } : {})} />
        )}
      </div>

      <div className="panel">
        <h2 className="section-title">Scores</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {(["technical", "fundamental", "valuation"] as const).map((kind) => {
            const row = scores.data?.[kind];
            const score = kind === "technical" ? s.technical_score : kind === "fundamental" ? s.fundamental_score : s.valuation_score;
            const cls = kind === "technical" ? s.technical_class : kind === "fundamental" ? s.fundamental_class : s.valuation_class;
            return (
              <div key={kind} className="space-y-2">
                <ScoreBar label={kind[0].toUpperCase() + kind.slice(1)} score={score} classification={cls} />
                {kind === "fundamental" && score == null && s.fundamental_note && (
                  <div className="rounded-md border border-warn-border bg-warn-bg p-2 text-xs text-warn-fg">Withheld: {s.fundamental_note}</div>
                )}
                {(row?.components ?? []).map((c) => <ComponentBar key={c.key} name={c.name} points={c.points} weight={c.weight} notes={c.notes ?? []} />)}
              </div>
            );
          })}
        </div>
      </div>

      {facts.length > 0 && (
        <div>
          <h2 className="section-title">Facts</h2>
          <div className="table-wrap"><table className="data-table"><tbody>
            {facts.map((f) => (
              <tr key={f.label}><td className="text-muted-foreground">{f.label}</td><td className="!whitespace-normal font-medium">{f.value == null ? "—" : String(f.value)}</td></tr>
            ))}
          </tbody></table></div>
        </div>
      )}

      <div>
        <h2 className="section-title">Signal history</h2>
        {history.isLoading ? <TableSkeleton /> : history.error ? <ErrorBox what="signal history" /> : !history.data?.length ? <Empty>No signal history yet.</Empty> : (
          <div className="table-wrap"><table className="data-table">
            <thead><tr><th>Created</th><th>Strategy</th><th>Action</th><th>Status</th><th className="num">Price</th><th className="num">Entry</th><th className="num">Stop</th><th className="num">Target 1</th><th className="num">R:R</th><th>Closed reason</th></tr></thead>
            <tbody>
              {history.data.map((h, i) => (
                <tr key={i}>
                  <td>{fmtDate(h.created_at)}</td><td>{strategyLabel(h.strategy)}</td><td><ActionBadge action={h.action} /></td>
                  <td className="capitalize">{h.status ?? "—"}</td><td className="num">{inr(h.price_at_signal)}</td>
                  <td className="num">{h.entry_low == null && h.entry_high == null ? "—" : `${inr(h.entry_low)} – ${inr(h.entry_high)}`}</td>
                  <td className="num">{inr(h.stop_loss)}</td><td className="num">{inr(h.target_1)}</td><td className="num">{fixed(h.risk_reward)}</td>
                  <td className="!whitespace-normal text-muted-foreground">{h.closed_reason ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </div>
    </div>
  );
}

function StockPaperPositions({ symbol }: { symbol: string }) {
  const positions = usePaperPositions();
  const rows = (positions.data ?? []).filter((p) => p.symbol === symbol);
  return (
    <section>
      <h2 className="section-title">Paper positions</h2>
      {positions.isLoading ? <TableSkeleton rows={2} /> : positions.error ? <ErrorBox what="paper positions" /> : !rows.length ? <Empty>No paper positions for this stock.</Empty> : (
        <div className="table-wrap"><table className="data-table">
          <thead><tr><th>Account</th><th>Strategy</th><th className="num">Qty</th><th className="num">Avg cost</th><th className="num">Last close</th><th className="num">Unrealised P&amp;L</th><th>Advice</th></tr></thead>
          <tbody>{rows.map((p) => (
            <tr key={p.id}>
              <td>{p.account_name ?? (p.mode === "auto" ? "Model portfolio" : "My trades")}</td>
              <td>{strategyLabel(p.strategy)}</td><td className="num">{int(p.quantity)}</td>
              <td className="num">{inr(p.avg_cost)}</td><td className="num">{inr(p.last_close)}</td>
              <td className="num">{inr(p.unrealised_pnl)} <Change value={p.unrealised_pct} /></td>
              <td><AdviceBadge advice={p.advice} note={p.advice_note} /></td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </section>
  );
}

function Bullets({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>
      <ul className="mt-0.5 list-disc space-y-0.5 pl-4 text-xs">{items.map((t, i) => <li key={i}>{t}</li>)}</ul>
    </div>
  );
}
