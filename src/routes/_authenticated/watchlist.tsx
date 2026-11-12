import { createFileRoute, Link } from "@tanstack/react-router";
import { Empty, ErrorBox, TableSkeleton } from "@/components/States";
import { useWatchlist } from "@/hooks/useWatchlist";
import { fixed, inr, pct, strategyLabel } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/watchlist")({
  head: () => ({
    meta: [
      { title: "Breakout Watchlist — Equity Intelligence" },
      { name: "description", content: "Stocks coiling just under resistance, closest to their trigger first." },
      { property: "og:title", content: "Breakout Watchlist — Equity Intelligence" },
      { property: "og:description", content: "Stocks coiling just under resistance, closest to their trigger first." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WatchlistPage,
});

function WatchlistPage() {
  const { data, isLoading, error } = useWatchlist();
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold tracking-tight">Breakout Watchlist</h1>
      <p className="text-xs text-muted-foreground">
        Stocks coiling just under resistance. A buy is signalled only when the trigger condition is met at a daily close.
      </p>
      {isLoading ? (
        <TableSkeleton />
      ) : error ? (
        <ErrorBox what="the watchlist" />
      ) : !data?.length ? (
        <Empty>No stocks are coiling under resistance right now.</Empty>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Name</th>
                <th>Strategy</th>
                <th className="num">Price</th>
                <th>Trigger</th>
                <th className="num">Distance to trigger</th>
                <th className="num">Stop</th>
                <th className="num">Target 1</th>
                <th className="num">R:R</th>
                <th className="num">Combined score</th>
              </tr>
            </thead>
            <tbody>
              {data.map((s) => (
                <tr key={s.id}>
                  <td>
                    <Link to="/stock/$symbol" params={{ symbol: s.symbol }} className="font-semibold text-primary hover:underline">{s.symbol}</Link>
                  </td>
                  <td className="max-w-[200px] truncate">{s.name}</td>
                  <td>{strategyLabel(s.strategy)}</td>
                  <td className="num">{inr(s.price)}</td>
                  <td className="min-w-[220px] !whitespace-normal">{s.trigger || "—"}</td>
                  <td className="num font-medium">{pct(s.distance_to_entry_pct, 2)}</td>
                  <td className="num text-level-stop">{inr(s.stop_loss)}</td>
                  <td className="num">{inr(s.target_1)}</td>
                  <td className="num">{fixed(s.risk_reward)}</td>
                  <td className="num">{fixed(s.combined_score, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
