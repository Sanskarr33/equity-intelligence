import { useQuery } from "@tanstack/react-query";
import { supabase, fetchAll } from "@/lib/supabase";
import type { StockRow } from "@/lib/types";

export function useStocks() {
  return useQuery({
    queryKey: ["v_stocks"],
    queryFn: () =>
      fetchAll<StockRow>((from, to) =>
        supabase.from("v_stocks").select("*").order("symbol").range(from, to),
      ),
  });
}

export function useStock(symbol: string) {
  return useQuery({
    queryKey: ["v_stocks", symbol],
    queryFn: async () => {
      const { data, error } = await supabase.from("v_stocks").select("*").eq("symbol", symbol).maybeSingle();
      if (error) throw error;
      return data as StockRow | null;
    },
  });
}
