import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchAll, supabase } from "@/lib/supabase";
import type { Num } from "@/lib/format";
import type { Strategy } from "@/lib/types";

export type AccountMode = "auto" | "manual";
export type Advice = "HOLD" | "TRAIL_STOP" | "BOOK_PROFIT" | "EXIT" | "REVIEW";

export interface PaperAccount {
  id: string; name: string; mode: AccountMode; initial_capital: Num; cash: Num; processed_through: string | null;
  invested: Num; market_value: Num; equity: Num; return_pct: Num; unrealised_pnl: Num; realised_pnl: Num;
  total_charges: Num; open_positions: Num; working_orders: Num;
}
export interface PaperPosition {
  id: string; account_id: string; account_name: string; mode: AccountMode; strategy: Strategy; instrument_id: string;
  symbol: string; name: string | null; quantity: Num; avg_cost: Num; cost_basis: Num; entry_date: string | null;
  last_close: Num; last_close_date: string | null; market_value: Num; unrealised_pnl: Num; unrealised_pct: Num;
  realised_pnl: Num; total_charges: Num; stop_loss: Num; initial_stop: Num; target_1: Num; target_2: Num;
  invalidation_level: Num; target_1_hit: boolean | null; max_holding_days: Num; advice: Advice | null;
  advice_note: string | null; advice_as_of: string | null; signal_id: string | null;
}
export interface PaperOrder {
  id: string; account_id: string; account_name: string; mode: AccountMode; strategy: Strategy; symbol: string;
  name: string | null; side: "BUY" | "SELL"; order_type: string | null; purpose: string | null; placed_by: string | null;
  quantity: Num; filled_quantity: Num; limit_price: Num; avg_fill_price: Num; total_charges: Num; status: string;
  reject_reason: string | null; placed_at: string | null; expires_at: string | null; cancelled_at: string | null;
  updated_at: string | null; signal_id: string | null;
}
export interface PaperTrade {
  id: string; account_id: string; strategy: Strategy; symbol: string; name: string | null; entry_date: string | null;
  exit_date: string | null; days_held: Num; quantity: Num; avg_buy_price: Num; avg_sell_price: Num; realised_pnl: Num;
  total_charges: Num; return_pct: Num; exit_reasons: unknown;
}
export interface PaperPerformance {
  account_id: string; strategy: Strategy; closed_trades: Num; wins: Num; win_rate_pct: Num; avg_win: Num; avg_loss: Num;
  profit_factor: Num; expectancy_per_trade: Num; realised_pnl: Num; avg_days_held: Num; insufficient_history: boolean | null;
}
export interface Snapshot {
  snapshot_date: string; equity: Num; benchmark_closes: Record<string, number> | null;
}

export const WORKING = ["OPEN", "PARTIALLY_FILLED", "PENDING"];

export const PURPOSE_WORDS: Record<string, string> = {
  entry: "Entry", stop_loss: "Stop-loss", target_1: "Target 1", target_2: "Target 2", invalidation: "Thesis broke",
  signal_exit: "Signal turned negative", time_exit: "Time limit", manual_exit: "You exited",
};
export const purposeLabel = (p: string | null | undefined) => (p ? PURPOSE_WORDS[p] ?? p.replace(/_/g, " ") : "—");

export function usePaperAccounts() {
  return useQuery({
    queryKey: ["paper", "accounts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("v_paper_accounts").select("*");
      if (error) throw error;
      return (data ?? []) as PaperAccount[];
    },
  });
}
export function usePaperPositions() {
  return useQuery({
    queryKey: ["paper", "positions"],
    queryFn: () => fetchAll<PaperPosition>((f, t) => supabase.from("v_paper_positions").select("*").order("symbol").range(f, t)),
  });
}
export function useWorkingOrders() {
  return useQuery({
    queryKey: ["paper", "orders", "working"],
    queryFn: () =>
      fetchAll<PaperOrder>((f, t) =>
        supabase.from("v_paper_orders").select("*").in("status", WORKING).order("placed_at", { ascending: false }).range(f, t),
      ),
  });
}
export function useRecentOrders(accountId: string | undefined) {
  return useQuery({
    queryKey: ["paper", "orders", "recent", accountId],
    enabled: !!accountId,
    queryFn: async () => {
      const { data, error } = await supabase.from("v_paper_orders").select("*").eq("account_id", accountId!)
        .order("updated_at", { ascending: false, nullsFirst: false }).limit(30);
      if (error) throw error;
      return (data ?? []) as PaperOrder[];
    },
  });
}
export function usePaperTrades(accountId: string | undefined) {
  return useQuery({
    queryKey: ["paper", "trades", accountId],
    enabled: !!accountId,
    queryFn: () =>
      fetchAll<PaperTrade>((f, t) =>
        supabase.from("v_paper_trades").select("*").eq("account_id", accountId!).order("exit_date", { ascending: false }).range(f, t),
      ),
  });
}
export function usePaperPerformance(accountId: string | undefined) {
  return useQuery({
    queryKey: ["paper", "performance", accountId],
    enabled: !!accountId,
    queryFn: async () => {
      const { data, error } = await supabase.from("v_paper_performance").select("*").eq("account_id", accountId!);
      if (error) throw error;
      return (data ?? []) as PaperPerformance[];
    },
  });
}
export function useSnapshots(accountId: string | undefined) {
  return useQuery({
    queryKey: ["paper", "snapshots", accountId],
    enabled: !!accountId,
    queryFn: () =>
      fetchAll<Snapshot>((f, t) =>
        supabase.from("portfolio_snapshots")
          .select("snapshot_date,cash,market_value,equity,realised_pnl,unrealised_pnl,total_charges,benchmark_closes,by_strategy")
          .eq("account_id", accountId!).order("snapshot_date").range(f, t) as never,
      ),
  });
}

function usePaperRpc<V>(fn: string, toArgs: (v: V) => Record<string, unknown>, success: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: V) => {
      const { data, error } = await supabase.rpc(fn as never, toArgs(v) as never);
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["paper"] });
      toast.success(success);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export const usePlaceOrder = () =>
  usePaperRpc<{ signalId: string; quantity: number }>(
    "paper_place_order",
    (v) => ({ p_signal_id: v.signalId, p_quantity: v.quantity, p_limit_price: null }),
    "Paper order placed — it fills at the next trading day's prices if the price is in range",
  );
export const useCancelOrder = () =>
  usePaperRpc<string>("paper_cancel_order", (id) => ({ p_order_id: id }), "Order cancelled");
export const useExitPosition = () =>
  usePaperRpc<string>("paper_exit_position", (id) => ({ p_position_id: id }), "Exit queued — it sells at the next trading day's open");
