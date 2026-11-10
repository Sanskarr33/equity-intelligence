import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { SignalRow } from "@/lib/types";

export function useStockSignals(instrumentId: string | undefined) {
  return useQuery({
    queryKey: ["v_signals", "instrument", instrumentId],
    enabled: !!instrumentId,
    queryFn: async () => {
      const { data, error } = await supabase.from("v_signals").select("*").eq("instrument_id", instrumentId!);
      if (error) throw error;
      return (data ?? []) as SignalRow[];
    },
  });
}
