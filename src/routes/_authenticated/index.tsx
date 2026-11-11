import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Fragment, useState } from "react";
import { ActionBadge } from "@/components/ActionBadge";
import { PaperBuyButton } from "@/components/paper/PaperBuyButton";
import { ExplanationPanel } from "@/components/ExplanationPanel";
import { Empty, ErrorBox, TableSkeleton } from "@/components/States";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDataHealth } from "@/hooks/useDataHealth";
import { useMarketRegime } from "@/hooks/useMarketRegime";
import { useOpportunities } from "@/hooks/useOpportunities";
import { confidencePct, fixed, fmtDate, inr, int, setupLabel } from "@/lib/format";
import type { Strategy } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Opportunities — Equity Intelligence" },
      { name: "description", content: "Today's BUY and ACCUMULATE signals across swing, positional and long-term strategies." },
      { property: "og:title", content: "Opportunities — Equity Intelligence" },
      { property: "og:description", content: "Today's BUY and ACCUMULATE signals for Nifty 500 stocks." },
    ],
  }),
  component: OpportunitiesPage,
});

const TABS: { key: Strategy; label: string; horizon: string }[] = [
  { key: "swing", label: "Swing", horizon: "days–weeks" },
  { key: "positional", label: "Positional", horizon: "weeks–months" },
  { key: "long_term", label: "Long-term", horizon: "months–years" },
];

function OpportunitiesPage() {
  const health = useDataHealth();
  const regime = useMarketRegime();
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border bg-card px-3 py-2 text-xs">
        <span>
          Data as of <strong>{health.isLoading ? "…" : fmtDate(health.data?.latest_price_date)}</strong>
        </span>
        {regime.data && (
          <span>
            Market regime: <strong>{regime.data}</strong>
          </span>
        )}
      </div>
      <h1 className="text-xl font-semibold tracking-tight">Opportunities</h1>
      <Tabs defaultValue="swing">
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.key} value={t.key} className="text-xs">
              {t.label} <span className="ml-1 hidden text-muted-foreground sm:inline">({t.horizon})</span>
            </TabsTrigger>
          ))}
        </TabsList>
        {TABS.map((t) => (
          <TabsContent key={t.key} value={t.key} className="mt-3">
            <OppTable strategy={t.key} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function OppTable({ strategy }: { strategy: Strategy }) {
  const { data, isLoading, error } = useOpportunities(strategy);
  const [open, setOpen] = useState<string | null>(null);
  if (isLoading) return <TableSkeleton />;
  if (error) return <ErrorBox what="signals" />;
  if (!data?.length) return <Empty>No entries today for this strategy — the rules only buy on a clean setup.</Empty>;
  const lt = strategy === "long_term";
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th className="w-6" />
            <th>Symbol</th>
            <th>Name</th>
            <th>Action</th>
            <th className="num">Price</th>
            <th className="num">Entry range</th>
            <th className="num">{lt ? "Review below" : "Stop"}</th>
            <th className="num">Target 1</th>
            <th className="num">Target 2</th>
            <th className="num">R:R</th>
            <th className="num">Qty</th>
            <th className="num">Confidence</th>
            <th>Setup</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {data.map((s) => {
            const isOpen = open === s.id;
            return (
              <Fragment key={s.id}>
                <tr className="cursor-pointer" onClick={() => setOpen(isOpen ? null : s.id)}>
                  <td className="text-muted-foreground">{isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}</td>
                  <td>
                    <Link to="/stock/$symbol" params={{ symbol: s.symbol }} onClick={(e) => e.stopPropagation()} className="font-semibold text-primary hover:underline">
                      {s.symbol}
                    </Link>
                  </td>
                  <td className="max-w-[200px] truncate">{s.name}</td>
                  <td><ActionBadge action={s.action} /></td>
                  <td className="num">{inr(s.price)}</td>
                  <td className="num">{s.entry_low == null && s.entry_high == null ? "—" : `${inr(s.entry_low)} – ${inr(s.entry_high)}`}</td>
                  <td className="num text-level-stop">{inr(lt ? s.invalidation_level : s.stop_loss)}</td>
                  <td className="num">{inr(s.target_1)}</td>
                  <td className="num">{inr(s.target_2)}</td>
                  <td className="num">{fixed(s.risk_reward)}</td>
                  <td className="num">{int(s.quantity)}</td>
                  <td className="num font-medium">{confidencePct(s.confidence)}</td>
                  <td className="capitalize">{setupLabel(s.setup)}</td>
                  <td onClick={(e) => e.stopPropagation()}><PaperBuyButton s={s} /></td>
                </tr>
                {isOpen && (
                  <tr>
                    <td colSpan={14} className="!whitespace-normal bg-muted/40 px-4 py-3">
                      <ExplanationPanel s={s} columns />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
