import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { HistoryRow } from "@/lib/types";

export function useSignalHistory(instrumentId: string | undefined) {
  return useQuery({
    queryKey: ["investment_signals", instrumentId],
    enabled: !!instrumentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investment_signals")
        .select("strategy,action,status,entry_low,entry_high,stop_loss,target_1,risk_reward,price_at_signal,created_at,closed_reason")
        .eq("instrument_id", instrumentId!)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as HistoryRow[];
    },
  });
}
