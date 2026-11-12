import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useMemo, useState } from "react";
import { ActionBadge } from "@/components/ActionBadge";
import { Change } from "@/components/Change";
import { Empty, ErrorBox, TableSkeleton } from "@/components/States";
import { useStocks } from "@/hooks/useStocks";
import { fixed, inr, num } from "@/lib/format";
import type { StockRow } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/stocks")({
  head: () => ({
    meta: [
      { title: "Stocks — Equity Intelligence" },
      { name: "description", content: "Searchable list of Nifty 500 stocks with scores and strategy verdicts." },
      { property: "og:title", content: "Stocks — Equity Intelligence" },
      { property: "og:description", content: "Searchable list of Nifty 500 stocks with scores and strategy verdicts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StocksPage,
});

type Key = "symbol" | "name" | "framework" | "close" | "change_pct" | "technical_score" | "fundamental_score" | "valuation_score";
const NUMERIC: Key[] = ["close", "change_pct", "technical_score", "fundamental_score", "valuation_score"];
const ACTIONS = ["BUY", "ACCUMULATE", "WAIT", "AVOID", "NO_TRADE"];

function StocksPage() {
  const { data, isLoading, error } = useStocks();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: Key; dir: 1 | -1 }>({ key: "symbol", dir: 1 });
  const [framework, setFramework] = useState("");
  const [swing, setSwing] = useState("");
  const [positional, setPositional] = useState("");
  const [longTerm, setLongTerm] = useState("");

  const frameworks = useMemo(() => [...new Set((data ?? []).map((s) => s.framework).filter(Boolean))].sort() as string[], [data]);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    const list = (data ?? []).filter(
      (s) =>
        (!t || s.symbol.toLowerCase().includes(t) || (s.name ?? "").toLowerCase().includes(t)) &&
        (!framework || s.framework === framework) &&
        (!swing || s.swing_action === swing) &&
        (!positional || s.positional_action === positional) &&
        (!longTerm || s.long_term_action === longTerm),
    );
    const numeric = NUMERIC.includes(sort.key);
    return list.sort((a, b) => {
      if (numeric) {
        const x = num(a[sort.key] as never), y = num(b[sort.key] as never);
        if (x === null) return 1;
        if (y === null) return -1;
        return (x - y) * sort.dir;
      }
      return String(a[sort.key] ?? "").localeCompare(String(b[sort.key] ?? "")) * sort.dir;
    });
  }, [data, q, sort, framework, swing, positional, longTerm]);

  const Th = ({ k, label, n }: { k: Key; label: string; n?: boolean }) => (
    <th className={n ? "num" : ""}>
      <button
        type="button"
        className="inline-flex items-center gap-0.5 uppercase"
        onClick={() => setSort((s) => ({ key: k, dir: s.key === k ? (-s.dir as 1 | -1) : n ? -1 : 1 }))}
      >
        {label}
        {sort.key === k && (sort.dir === 1 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </button>
    </th>
  );

  const Sel = ({ label, value, set, options }: { label: string; value: string; set: (v: string) => void; options: string[] }) => (
    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {label}
      <select value={value} onChange={(e) => set(e.target.value)} className="field-input text-xs text-foreground">
        <option value="">All</option>
        {options.map((o) => <option key={o} value={o}>{o.replace("_", " ")}</option>)}
      </select>
    </label>
  );

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold tracking-tight">Stocks</h1>
      <div className="flex flex-wrap items-center gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by symbol or name…" className="field-input w-56" aria-label="Filter stocks" />
        <Sel label="Framework" value={framework} set={setFramework} options={frameworks} />
        <Sel label="Swing" value={swing} set={setSwing} options={ACTIONS} />
        <Sel label="Positional" value={positional} set={setPositional} options={ACTIONS} />
        <Sel label="Long-term" value={longTerm} set={setLongTerm} options={ACTIONS} />
        {data && <span className="text-xs text-muted-foreground">{rows.length} of {data.length}</span>}
      </div>
      {isLoading ? (
        <TableSkeleton rows={14} />
      ) : error ? (
        <ErrorBox what="stocks" />
      ) : !rows.length ? (
        <Empty>No stocks match these filters.</Empty>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <Th k="symbol" label="Symbol" />
                <Th k="name" label="Name" />
                <Th k="framework" label="Framework" />
                <Th k="close" label="Close" n />
                <Th k="change_pct" label="Change %" n />
                <Th k="technical_score" label="Technical" n />
                <Th k="fundamental_score" label="Fundamental" n />
                <Th k="valuation_score" label="Valuation" n />
                <th>Swing</th>
                <th>Positional</th>
                <th>Long-term</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s: StockRow) => (
                <tr key={s.instrument_id}>
                  <td><Link to="/stock/$symbol" params={{ symbol: s.symbol }} className="font-semibold text-primary hover:underline">{s.symbol}</Link></td>
                  <td className="max-w-[220px] truncate">{s.name}</td>
                  <td>{s.framework ?? "—"}</td>
                  <td className="num">{inr(s.close)}</td>
                  <td className="num"><Change value={s.change_pct} /></td>
                  <td className="num">{fixed(s.technical_score, 0)}</td>
                  <td className="num">{fixed(s.fundamental_score, 0)}</td>
                  <td className="num">{fixed(s.valuation_score, 0)}</td>
                  <td><ActionBadge action={s.swing_action} /></td>
                  <td><ActionBadge action={s.positional_action} /></td>
                  <td><ActionBadge action={s.long_term_action} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
