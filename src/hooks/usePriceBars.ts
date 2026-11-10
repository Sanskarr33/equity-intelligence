import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { PriceBar } from "@/lib/types";

export function usePriceBars(instrumentId: string | undefined) {
  return useQuery({
    queryKey: ["price_bars", instrumentId],
    enabled: !!instrumentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_bars")
        .select("trade_date,open,high,low,close,volume")
        .eq("instrument_id", instrumentId!)
        .eq("interval", "1day")
        .order("trade_date", { ascending: false })
        .limit(260);
      if (error) throw error;
      return ((data ?? []) as PriceBar[]).reverse();
    },
  });
}
