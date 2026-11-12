import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { type ReactNode, useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Change } from "@/components/Change";
import { AdviceBadge } from "@/components/paper/AdviceBadge";
import { Empty, ErrorBox, TableSkeleton } from "@/components/States";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { asStringArray, fixed, fmtDate, fmtDateTime, inr, int, num, pct, strategyLabel } from "@/lib/format";
import {
  type AccountMode, type PaperPosition, purposeLabel, useCancelOrder, useExitPosition, usePaperAccounts, usePaperPerformance,
  usePaperPositions, usePaperTrades, useRecentOrders, useSnapshots, useWorkingOrders,
} from "@/lib/paper";

export const Route = createFileRoute("/_authenticated/portfolio")({
  validateSearch: (search: Record<string, unknown>) => ({
    account: search.account === "manual" ? "manual" : "auto",
  }),
  head: () => ({
    meta: [
      { title: "Paper Portfolio — Equity Intelligence" },
      { name: "description", content: "Paper-trading accounts: equity curve, open positions, orders and closed trades." },
      { property: "og:title", content: "Paper Portfolio — Equity Intelligence" },
      { property: "og:description", content: "Model portfolio and your own paper trades, tracked daily." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PortfolioPage,
});

const ACCOUNTS: { mode: AccountMode; label: string; blurb: string }[] = [
  { mode: "auto", label: "Model portfolio", blurb: "the system follows every Buy signal and manages exits" },
  { mode: "manual", label: "My trades", blurb: "your own paper trades" },
];

function PortfolioPage() {
  const { account } = Route.useSearch();
  const mode: AccountMode = account === "manual" ? "manual" : "auto";
  const navigate = useNavigate({ from: "/portfolio" });
  const accounts = usePaperAccounts();
  const acc = accounts.data?.find((a) => a.mode === mode);
  const manual = mode === "manual";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Portfolio</h1>
          <p className="text-xs text-muted-foreground">{ACCOUNTS.find((a) => a.mode === mode)?.blurb}</p>
        </div>
        <div className="inline-flex rounded-md border bg-card p-0.5">
          {ACCOUNTS.map((a) => (
            <button key={a.mode} type="button" onClick={() => navigate({ search: { account: a.mode } })}
              className={`rounded px-3 py-1.5 text-xs ${mode === a.mode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {accounts.isLoading ? <TableSkeleton rows={4} /> : accounts.error ? <ErrorBox what="your paper account" /> : !acc ? (
        <Empty>No paper account found yet.</Empty>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            <Kpi label="Equity" value={inr(acc.equity)} />
            <Kpi label={`Return (vs ${inr(acc.initial_capital ?? 500000).replace(".00", "")} start)`} value={<Change value={acc.return_pct} />} />
            <Kpi label="Cash" value={inr(acc.cash)} />
            <Kpi label="Invested" value={inr(acc.invested)} />
            <Kpi label="Unrealised P&L" value={<Money v={acc.unrealised_pnl} />} />
            <Kpi label="Realised P&L" value={<Money v={acc.realised_pnl} />} />
            <Kpi label="Charges paid" value={inr(acc.total_charges)} />
            <Kpi label="Open positions" value={int(acc.open_positions)} />
            <Kpi label="Working orders" value={int(acc.working_orders)} />
            <Kpi label="Simulated through" value={fmtDate(acc.processed_through)} />
          </div>
          <EquityCurve accountId={acc.id} />
          <Performance accountId={acc.id} />
          <Positions accountId={acc.id} manual={manual} />
          <WorkingOrders accountId={acc.id} manual={manual} />
          <ClosedTrades accountId={acc.id} />
          <RecentActivity accountId={acc.id} />
        </>
      )}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-md border bg-card px-3 py-2">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-base font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function Money({ v }: { v: unknown }) {
  const n = num(v as never);
  return <span className={n == null || n === 0 ? "" : n > 0 ? "tone-up" : "tone-down"}>{inr(n)}</span>;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <div><h2 className="section-title">{title}</h2>{children}</div>;
}

function EquityCurve({ accountId }: { accountId: string }) {
  const snaps = useSnapshots(accountId);
  const data = useMemo(() => {
    const rows = snaps.data ?? [];
    const e0 = num(rows[0]?.equity);
    const b0 = num(rows.find((r) => num(r.benchmark_closes?.["NIFTY 500"]) != null)?.benchmark_closes?.["NIFTY 500"]);
    return rows.map((r) => {
      const e = num(r.equity), b = num(r.benchmark_closes?.["NIFTY 500"]);
      return { date: r.snapshot_date, Portfolio: e != null && e0 ? +(e / e0 * 100).toFixed(2) : null, "NIFTY 500": b != null && b0 ? +(b / b0 * 100).toFixed(2) : null };
    });
  }, [snaps.data]);
  return (
    <div className="panel">
      <h2 className="section-title">Equity curve (indexed to 100)</h2>
      {snaps.isLoading ? <TableSkeleton rows={5} /> : snaps.error ? <ErrorBox what="the equity curve" /> : data.length < 2 ? <Empty>Not enough history yet.</Empty> : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ left: -10, right: 8, top: 4 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} minTickGap={40} />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
              <Tooltip labelFormatter={(l) => fmtDate(String(l))} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="Portfolio" stroke="var(--primary)" dot={false} strokeWidth={2} connectNulls />
              <Line type="monotone" dataKey="NIFTY 500" stroke="var(--muted-foreground)" dot={false} strokeDasharray="4 3" connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function Performance({ accountId }: { accountId: string }) {
  const q = usePaperPerformance(accountId);
  return (
    <Section title="Performance by strategy">
      {q.isLoading ? <TableSkeleton rows={3} /> : q.error ? <ErrorBox what="performance" /> : !q.data?.length ? <Empty>No closed trades yet.</Empty> : (
        <div className="table-wrap"><table className="data-table">
          <thead><tr><th>Strategy</th><th className="num">Closed trades</th><th className="num">Win rate</th><th className="num">Avg win</th><th className="num">Avg loss</th><th className="num">Profit factor</th><th className="num">Expectancy/trade</th><th className="num">Realised P&L</th><th className="num">Avg days held</th></tr></thead>
          <tbody>{q.data.map((p) => (
            <tr key={p.strategy}>
              <td>{strategyLabel(p.strategy)}{p.insufficient_history && <div className="text-[11px] text-muted-foreground">Fewer than 20 closed trades — too early to judge.</div>}</td>
              <td className="num">{int(p.closed_trades)}</td><td className="num">{pct(p.win_rate_pct)}</td>
              <td className="num">{inr(p.avg_win)}</td><td className="num">{inr(p.avg_loss)}</td><td className="num">{fixed(p.profit_factor)}</td>
              <td className="num"><Money v={p.expectancy_per_trade} /></td><td className="num"><Money v={p.realised_pnl} /></td><td className="num">{fixed(p.avg_days_held, 1)}</td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </Section>
  );
}

function Positions({ accountId, manual }: { accountId: string; manual: boolean }) {
  const q = usePaperPositions();
  const exit = useExitPosition();
  const [confirm, setConfirm] = useState<PaperPosition | null>(null);
  const rows = (q.data ?? []).filter((p) => p.account_id === accountId);
  return (
    <Section title="Open positions">
      {q.isLoading ? <TableSkeleton rows={4} /> : q.error ? <ErrorBox what="positions" /> : !rows.length ? <Empty>No open positions.</Empty> : (
        <div className="table-wrap"><table className="data-table">
          <thead><tr><th>Symbol</th><th>Strategy</th><th className="num">Qty</th><th className="num">Avg cost</th><th className="num">Last close</th><th className="num">Value</th><th className="num">Unrealised</th><th className="num">Stop</th><th className="num">Target 1 / 2</th><th>Advice</th>{manual && <th />}</tr></thead>
          <tbody>{rows.map((p) => <PositionRow key={p.id} p={p} action={manual ? <Button size="sm" variant="outline" className="h-6 px-2 text-[11px]" onClick={() => setConfirm(p)}>Exit at next open</Button> : undefined} />)}</tbody>
        </table></div>
      )}
      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit {confirm?.symbol}?</AlertDialogTitle>
            <AlertDialogDescription>This queues a paper sell of {int(confirm?.quantity)} shares at the next trading day's open.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirm && exit.mutate(confirm.id)}>Exit at next open</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Section>
  );
}

function PositionRow({ p, action, showAccount }: { p: PaperPosition; action?: ReactNode; showAccount?: boolean }) {
  const lt = p.strategy === "long_term";
  return (
    <tr>
      {showAccount ? <td>{p.account_name}</td> : <td><Link to="/stock/$symbol" params={{ symbol: p.symbol }} className="font-semibold text-primary hover:underline">{p.symbol}</Link></td>}
      <td>{strategyLabel(p.strategy)}</td>
      <td className="num">{int(p.quantity)}</td><td className="num">{inr(p.avg_cost)}</td>
      <td className="num">{inr(p.last_close)}</td><td className="num">{inr(p.market_value)}</td>
      <td className="num"><Money v={p.unrealised_pnl} /> <span className="text-[11px]"><Change value={p.unrealised_pct} /></span></td>
      <td className="num text-level-stop">{lt ? (p.invalidation_level == null ? "—" : `Review below ${inr(p.invalidation_level)}`) : inr(p.stop_loss)}</td>
      <td className="num">{inr(p.target_1)}{p.target_1_hit && " ✓"} / {inr(p.target_2)}</td>
      <td><AdviceBadge advice={p.advice} note={p.advice_note} /></td>
      {action !== undefined && <td>{action}</td>}
    </tr>
  );
}

function WorkingOrders({ accountId, manual }: { accountId: string; manual: boolean }) {
  const q = useWorkingOrders();
  const cancel = useCancelOrder();
  const rows = (q.data ?? []).filter((o) => o.account_id === accountId);
  return (
    <Section title="Working orders">
      {q.isLoading ? <TableSkeleton rows={3} /> : q.error ? <ErrorBox what="orders" /> : !rows.length ? <Empty>No working orders.</Empty> : (
        <div className="table-wrap"><table className="data-table">
          <thead><tr><th>Symbol</th><th>Strategy</th><th>Side</th><th>Purpose</th><th className="num">Qty</th><th className="num">Limit</th><th>Placed</th><th>Expires</th>{manual && <th />}</tr></thead>
          <tbody>{rows.map((o) => (
            <tr key={o.id}>
              <td className="font-semibold">{o.symbol}</td><td>{strategyLabel(o.strategy)}</td><td>{o.side}</td><td>{purposeLabel(o.purpose)}</td>
              <td className="num">{int(o.filled_quantity ?? 0)}/{int(o.quantity)}</td><td className="num">{inr(o.limit_price)}</td>
              <td>{fmtDateTime(o.placed_at)}</td><td>{fmtDate(o.expires_at)}</td>
              {manual && <td>{o.side === "BUY" && o.status === "OPEN" && (
                <Button size="sm" variant="outline" className="h-6 px-2 text-[11px]" disabled={cancel.isPending} onClick={() => cancel.mutate(o.id)}>Cancel</Button>
              )}</td>}
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </Section>
  );
}

function ClosedTrades({ accountId }: { accountId: string }) {
  const q = usePaperTrades(accountId);
  return (
    <Section title="Closed trades">
      {q.isLoading ? <TableSkeleton rows={4} /> : q.error ? <ErrorBox what="closed trades" /> : !q.data?.length ? <Empty>No closed trades yet.</Empty> : (
        <div className="table-wrap"><table className="data-table">
          <thead><tr><th>Symbol</th><th>Strategy</th><th>Entry → Exit</th><th className="num">Days</th><th className="num">Qty</th><th className="num">Buy avg</th><th className="num">Sell avg</th><th className="num">P&L</th><th className="num">Return</th><th>Exit reasons</th></tr></thead>
          <tbody>{q.data.map((t) => (
            <tr key={t.id}>
              <td><Link to="/stock/$symbol" params={{ symbol: t.symbol }} className="font-semibold text-primary hover:underline">{t.symbol}</Link></td>
              <td>{strategyLabel(t.strategy)}</td><td>{fmtDate(t.entry_date)} → {fmtDate(t.exit_date)}</td>
              <td className="num">{int(t.days_held)}</td><td className="num">{int(t.quantity)}</td>
              <td className="num">{inr(t.avg_buy_price)}</td><td className="num">{inr(t.avg_sell_price)}</td>
              <td className="num"><Money v={t.realised_pnl} /></td><td className="num"><Change value={t.return_pct} /></td>
              <td className="!whitespace-normal">{asStringArray(t.exit_reasons).map(purposeLabel).join(", ") || "—"}</td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </Section>
  );
}

function RecentActivity({ accountId }: { accountId: string }) {
  const q = useRecentOrders(accountId);
  return (
    <Section title="Recent order activity">
      {q.isLoading ? <TableSkeleton rows={4} /> : q.error ? <ErrorBox what="order activity" /> : !q.data?.length ? <Empty>No orders yet.</Empty> : (
        <div className="table-wrap"><table className="data-table">
          <thead><tr><th>Updated</th><th>Symbol</th><th>Strategy</th><th>Side</th><th>Purpose</th><th>By</th><th className="num">Qty</th><th className="num">Fill price</th><th>Status</th><th>Reason</th></tr></thead>
          <tbody>{q.data.map((o) => (
            <tr key={o.id}>
              <td>{fmtDateTime(o.updated_at ?? o.placed_at)}</td><td className="font-semibold">{o.symbol}</td><td>{strategyLabel(o.strategy)}</td>
              <td>{o.side}</td><td>{purposeLabel(o.purpose)}</td><td className="capitalize">{o.placed_by ?? "—"}</td>
              <td className="num">{int(o.filled_quantity ?? 0)}/{int(o.quantity)}</td><td className="num">{inr(o.avg_fill_price)}</td>
              <td className="text-[11px] font-medium">{o.status.replace(/_/g, " ")}</td>
              <td className="!whitespace-normal text-muted-foreground">{["REJECTED", "CANCELLED", "EXPIRED"].includes(o.status) ? o.reject_reason ?? "—" : ""}</td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </Section>
  );
}


